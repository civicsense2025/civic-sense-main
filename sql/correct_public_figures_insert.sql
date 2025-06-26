-- =====================================================================================
-- Corrected public_figures INSERT using ONLY existing columns
-- Based on actual database schema from lib/database.types.ts
-- =====================================================================================

-- Available columns in public_figures table:
-- id, bioguide_id, full_name, display_name, slug, bio, avatar_url, image_url
-- congress_member_type, current_state, current_district, party_affiliation
-- congressional_tenure_start, office, current_positions (TEXT[])
-- is_active, is_politician, category, related_question_topic_ids (TEXT[])
-- ai_tokens_used, created_at, updated_at

BEGIN;

-- Example INSERT with correct column names and types
INSERT INTO public.public_figures (
    bioguide_id,
    full_name,
    display_name,
    slug,
    bio,
    congress_member_type,
    current_state,
    current_district,
    party_affiliation,
    congressional_tenure_start,
    office,
    current_positions,
    is_active,
    is_politician,
    category,
    related_question_topic_ids,
    created_at,
    updated_at
) VALUES 
(
    'A000374',
    'Ralph Abraham',
    'Ralph Abraham',
    'ralph-abraham',
    'Representative from Louisiana',
    'representative',
    'LA',
    5,
    'Republican',
    '2015-01-03',
    '2435 Rayburn House Office Building',
    ARRAY['House Committee on Agriculture', 'House Committee on Armed Services']::TEXT[],
    true,
    true,
    'politician',
    ARRAY[]::TEXT[],
    NOW(),
    NOW()
),
(
    'A000055',
    'Robert Aderholt',
    'Robert Aderholt',
    'robert-aderholt',
    'Representative from Alabama',
    'representative',
    'AL',
    4,
    'Republican',
    '1997-01-07',
    '235 Cannon House Office Building',
    ARRAY['House Committee on Appropriations']::TEXT[],
    true,
    true,
    'politician',
    ARRAY[]::TEXT[],
    NOW(),
    NOW()
);

-- Add more inserts here following the same pattern...
-- Each insert should use ONLY the columns that exist in the actual schema

COMMIT;

-- =====================================================================================
-- Column mapping guide for converting old SQL files:
-- =====================================================================================
-- 
-- OLD COLUMN          → NEW COLUMN (if exists)
-- ------------------  → ---------------------
-- first_name          → REMOVE (use full_name instead)
-- last_name           → REMOVE (use full_name instead)  
-- description         → bio
-- current_positions   → current_positions (but as TEXT[], not JSONB)
-- name                → full_name
-- title               → office
-- positions           → current_positions
-- description         → bio
-- 
-- ===================================================================================== 