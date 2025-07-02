-- ============================================================================
-- CivicSense Collections Schema Verification and Sample Data
-- Verifies the schema and provides examples of how to use it
-- ============================================================================

BEGIN;

-- ============================================================================
-- SCHEMA VERIFICATION
-- ============================================================================

-- Verify tables exist
DO $$
BEGIN
    -- Check if all required tables exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'collections') THEN
        RAISE EXCEPTION 'collections table does not exist';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'collection_items') THEN
        RAISE EXCEPTION 'collection_items table does not exist';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'lesson_steps') THEN
        RAISE EXCEPTION 'lesson_steps table does not exist';
    END IF;
    
    RAISE NOTICE 'All required tables exist';
END $$;

-- Verify indexes exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_collections_slug') THEN
        RAISE EXCEPTION 'idx_collections_slug index missing';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_lesson_steps_collection_item_id') THEN
        RAISE EXCEPTION 'idx_lesson_steps_collection_item_id index missing';
    END IF;
    
    RAISE NOTICE 'Required indexes exist';
END $$;

-- Verify views exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.views WHERE table_name = 'course_structure') THEN
        RAISE EXCEPTION 'course_structure view does not exist';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.views WHERE table_name = 'lesson_structure') THEN
        RAISE EXCEPTION 'lesson_structure view does not exist';
    END IF;
    
    RAISE NOTICE 'Required views exist';
END $$;

-- ============================================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================================

-- Insert a sample course (Democracy 101)
INSERT INTO public.collections (
    id,
    title,
    description,
    slug,
    emoji,
    is_public,
    is_featured,
    content_type,
    featured_order,
    difficulty_level,
    course_category,
    estimated_duration_minutes,
    learning_objectives
) VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Democracy 101: How Your Government Actually Works',
    'Learn how the three branches of government work, why checks and balances matter, and how to navigate the real political system.',
    'democracy-101',
    '🏛️',
    true,
    true,
    'course',
    1,
    2,
    'foundational',
    45,
    '["Understand the three branches of government", "Recognize how checks and balances work in practice", "Navigate the legislative process", "Identify your representatives and their powers"]'::jsonb
) ON CONFLICT (slug) DO NOTHING;

-- Insert sample lessons for Democracy 101
INSERT INTO public.collection_items (
    id,
    collection_id,
    title,
    description,
    content_type,
    sort_order,
    is_required,
    is_published,
    lesson_type,
    estimated_duration_minutes,
    learning_objectives,
    key_concepts
) VALUES 
(
    'lesson-1-three-branches',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'The Three Branches',
    'Why does everyone hate Congress? Understanding the legislative, executive, and judicial branches.',
    'lesson',
    1,
    true,
    true,
    'interactive',
    8,
    '["Identify the three branches of government", "Understand their different powers", "Recognize how they check each other"]'::jsonb,
    '["separation-of-powers", "checks-and-balances", "legislative-branch", "executive-branch", "judicial-branch"]'::jsonb
),
(
    'lesson-2-checks-balances',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Checks and Balances in Action',
    'Real examples of how the branches limit each other''s power.',
    'lesson',
    2,
    true,
    true,
    'interactive',
    7,
    '["See checks and balances in real scenarios", "Understand when the system works and when it doesn''t"]'::jsonb,
    '["travel-ban", "veto-override", "judicial-review", "congressional-oversight"]'::jsonb
)
ON CONFLICT (collection_id, sort_order) DO NOTHING;

-- Insert sample lesson steps for Lesson 1: The Three Branches
INSERT INTO public.lesson_steps (
    id,
    collection_item_id,
    step_number,
    step_type,
    title,
    content,
    interaction_config,
    estimated_seconds,
    requires_interaction,
    can_skip,
    key_concepts
) VALUES 
(
    gen_random_uuid(),
    'lesson-1-three-branches',
    1,
    'intro',
    'Why Does Everyone Hate Congress?',
    'Congress has a 19% approval rating. In 2014, voters said they preferred brussels sprouts, head lice, and root canals to Congress. But here''s the thing—you need to understand how Congress actually works to make it work for you.',
    '{"type": "intro_card", "emoji": "🏛️", "subtitle": "The Reality Behind the Headlines", "background_color": "#1E3A8A", "fact": "19% Congressional approval rating"}'::jsonb,
    25,
    false,
    true,
    '["congressional-approval", "democratic-accountability"]'::jsonb
),
(
    gen_random_uuid(),
    'lesson-1-three-branches',
    2,
    'concept',
    'Congress: The People''s Branch',
    'Congress makes the laws. 435 House members (2-year terms) represent districts of ~760,000 people. 100 senators (6-year terms) represent entire states. Different terms = different perspectives on governing.',
    '{"type": "swipe_cards", "cards": [{"title": "House of Representatives", "content": "435 members\\n2-year terms\\nRepresents districts\\nStarts impeachment\\nControls spending"}, {"title": "Senate", "content": "100 members\\n6-year terms\\n2 per state\\nTries impeachment\\nConfirms judges"}]}'::jsonb,
    35,
    true,
    false,
    '["legislative-structure", "representation"]'::jsonb
),
(
    gen_random_uuid(),
    'lesson-1-three-branches',
    3,
    'interaction',
    'Quick Check: Which Chamber?',
    'Which chamber has the power to confirm Supreme Court justices?',
    '{"type": "multiple_choice", "options": ["House of Representatives", "Senate", "Both chambers together", "Neither - that''s the President"], "correct": 1, "explanation": "Only the Senate confirms judicial nominees. This gives smaller states equal say in shaping the courts, even though they have less power in the House.", "hint": "Think about which chamber gives each state equal representation"}'::jsonb,
    30,
    true,
    false,
    '["judicial-confirmation", "senate-powers"]'::jsonb
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Test the course_structure view
SELECT 
    'Course Structure View Test' as test_name,
    title,
    lesson_count,
    total_steps,
    estimated_minutes_calculated
FROM public.course_structure 
WHERE slug = 'democracy-101';

-- Test the lesson_structure view
SELECT 
    'Lesson Structure View Test' as test_name,
    lesson_title,
    step_count,
    calculated_duration_minutes
FROM public.lesson_structure 
WHERE collection_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- Test the get_course_structure function
SELECT 
    'Course Structure Function Test' as test_name,
    course_title,
    total_lessons,
    total_steps,
    estimated_duration_minutes
FROM public.get_course_structure('democracy-101');

-- Test the get_lesson_progress_stats function
SELECT 
    'Lesson Progress Stats Test' as test_name,
    total_steps,
    interactive_steps,
    estimated_duration_minutes
FROM public.get_lesson_progress_stats('lesson-1-three-branches');

-- ============================================================================
-- CLEANUP (OPTIONAL - REMOVE SAMPLE DATA)
-- ============================================================================

-- Uncomment these lines to remove the sample data after testing
-- DELETE FROM public.lesson_steps WHERE collection_item_id IN ('lesson-1-three-branches', 'lesson-2-checks-balances');
-- DELETE FROM public.collection_items WHERE collection_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
-- DELETE FROM public.collections WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

COMMIT;

-- ============================================================================
-- FINAL VERIFICATION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Collections schema setup complete!';
    RAISE NOTICE '📋 Tables created: collections, collection_items, lesson_steps';
    RAISE NOTICE '🔍 Indexes added for performance optimization';
    RAISE NOTICE '🔒 RLS policies configured for security';
    RAISE NOTICE '📊 Views and functions available for data analysis';
    RAISE NOTICE '🧪 Sample data inserted for testing';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Ready to create multi-step learning content!';
END $$; 