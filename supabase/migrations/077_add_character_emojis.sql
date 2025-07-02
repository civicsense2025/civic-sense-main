-- =============================================================================
-- ADD CHARACTER EMOJIS TO SCENARIO SYSTEM
-- =============================================================================
-- This migration adds emoji support to scenario characters and updates existing 
-- characters with appropriate emojis based on their roles

BEGIN;

-- =============================================================================
-- STEP 1: ADD EMOJI FIELD TO SCENARIO_CHARACTERS
-- =============================================================================

ALTER TABLE scenario_characters 
ADD COLUMN IF NOT EXISTS character_emoji VARCHAR(10) DEFAULT '👤';

-- =============================================================================
-- STEP 2: UPDATE EXISTING CHARACTERS WITH APPROPRIATE EMOJIS
-- =============================================================================

-- Update asylum scenario characters
UPDATE scenario_characters 
SET character_emoji = '👩‍🦱'
WHERE character_name = 'Maria Santos';

UPDATE scenario_characters 
SET character_emoji = '👩‍💼'
WHERE character_name = 'Sarah Chen';

UPDATE scenario_characters 
SET character_emoji = '👮‍♂️'
WHERE character_name = 'Officer Rodriguez';

UPDATE scenario_characters 
SET character_emoji = '👩‍⚖️'
WHERE character_name = 'Judge Patricia Williams';

-- Update city budget crisis characters
UPDATE scenario_characters 
SET character_emoji = '👨‍💼'
WHERE character_name = 'Mayor Thompson';

UPDATE scenario_characters 
SET character_emoji = '👩‍💼'
WHERE character_name = 'Council Member Davis';

UPDATE scenario_characters 
SET character_emoji = '👨‍🏫'
WHERE character_name = 'Budget Director Martinez';

-- Update any other characters based on their character_type
UPDATE scenario_characters 
SET character_emoji = CASE 
    WHEN character_type = 'elected_official' THEN '🏛️'
    WHEN character_type = 'judicial_official' THEN '👩‍⚖️'
    WHEN character_type = 'law_enforcement' THEN '👮‍♂️'
    WHEN character_type = 'legal_advocate' THEN '👩‍💼'
    WHEN character_type = 'vulnerable_individual' THEN '👤'
    WHEN character_type = 'government_official' THEN '👨‍💼'
    WHEN character_type = 'citizen' THEN '👥'
    WHEN character_type = 'activist' THEN '✊'
    WHEN character_type = 'business_leader' THEN '💼'
    WHEN character_type = 'community_organizer' THEN '🤝'
    WHEN character_type = 'journalist' THEN '📰'
    ELSE '👤'
END
WHERE character_emoji = '👤'; -- Only update default ones

-- =============================================================================
-- STEP 3: ADD MORE DIVERSE CHARACTERS FOR FUTURE SCENARIOS
-- =============================================================================

-- Add some additional characters with emojis for variety
INSERT INTO scenario_characters (
    character_name,
    character_title,
    character_emoji,
    character_type,
    starting_resources,
    character_constraints,
    victory_conditions,
    represents_stakeholder_group,
    usable_in_scenario_types
) VALUES
(
    'Alex Chen',
    'Young Environmental Activist',
    '🌱',
    'activist',
    '{"energy": 100, "social_media_followers": 5000, "credibility": 75}',
    ARRAY['Limited political connections', 'Resource constraints'],
    ARRAY['Raise environmental awareness', 'Influence policy decisions'],
    'Environmental advocates',
    ARRAY['crisis_response', 'local_government', 'policy_development']
),
(
    'Dr. Amelia Rodriguez',
    'Public Health Director',
    '👩‍⚕️',
    'government_official',
    '{"authority": 85, "budget": 500000, "staff": 50, "public_trust": 80}',
    ARRAY['Budget limitations', 'Political pressure'],
    ARRAY['Protect public health', 'Maintain department credibility'],
    'Public health officials',
    ARRAY['crisis_response', 'local_government']
),
(
    'James Washington',
    'Community Leader',
    '👨‍🦱',
    'community_organizer',
    '{"community_support": 90, "local_knowledge": 95, "political_connections": 60}',
    ARRAY['Limited formal authority', 'Resource constraints'],
    ARRAY['Represent community interests', 'Build consensus'],
    'Local residents',
    ARRAY['local_government', 'negotiation', 'policy_development']
),
(
    'Elena Vasquez',
    'Small Business Owner',
    '👩‍💼',
    'business_leader',
    '{"business_revenue": 200000, "employees": 12, "industry_connections": 70}',
    ARRAY['Economic pressures', 'Regulatory compliance'],
    ARRAY['Protect business interests', 'Support economic growth'],
    'Small business community',
    ARRAY['local_government', 'crisis_response', 'policy_development']
),
(
    'Marcus Thompson',
    'Investigative Journalist',
    '👨‍💻',
    'journalist',
    '{"press_credentials": 100, "sources": 80, "public_reach": 75000}',
    ARRAY['Deadline pressure', 'Source protection'],
    ARRAY['Uncover truth', 'Inform the public'],
    'Media and transparency advocates',
    ARRAY['crisis_response', 'negotiation', 'judicial_process']
);

COMMIT; 