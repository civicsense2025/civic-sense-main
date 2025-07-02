-- =============================================================================
-- EXPANDED SCENARIO CONTENT MIGRATION
-- =============================================================================
-- This migration adds complex, multi-step scenarios including the asylum seeker
-- scenario and expands existing scenarios with deeper decision trees

BEGIN;

-- =============================================================================
-- SCENARIO 4: ASYLUM SEEKER'S JOURNEY
-- =============================================================================

INSERT INTO scenarios (
    id,
    scenario_title,
    scenario_slug,
    description,
    scenario_type,
    difficulty_level,
    estimated_duration_minutes,
    learning_objectives,
    key_concepts,
    is_active,
    is_premium,
    created_at
) VALUES (
    gen_random_uuid(),
    'Seeking Safety: An Asylum Journey',
    'asylum-seeker-journey',
    'Experience the harrowing journey of an asylum seeker navigating the complex U.S. immigration system while facing detention, legal challenges, and the constant threat of deportation to a country that is not their own.',
    'crisis_response',
    5,
    75,
    ARRAY[
        'Understand the asylum process and legal protections',
        'Learn about immigration detention and ICE enforcement',
        'Explore due process rights for non-citizens',
        'Examine the role of legal representation in immigration cases',
        'Understand the difference between deportation and removal'
    ],
    ARRAY[
        'asylum_law',
        'immigration_detention',
        'due_process',
        'ice_enforcement',
        'legal_representation',
        'human_rights',
        'federal_jurisdiction'
    ],
    true,
    false,
    NOW()
);

COMMIT;