-- Verification script for lesson_steps table
-- Run this after creating the table to ensure everything works correctly

BEGIN;

-- Test 1: Check table exists and has correct structure
DO $$
BEGIN
    -- Check if table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lesson_steps') THEN
        RAISE EXCEPTION 'lesson_steps table does not exist';
    END IF;
    
    -- Check required columns exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_steps' AND column_name = 'collection_item_id') THEN
        RAISE EXCEPTION 'collection_item_id column missing';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_steps' AND column_name = 'step_type') THEN
        RAISE EXCEPTION 'step_type column missing';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_steps' AND column_name = 'sources') THEN
        RAISE EXCEPTION 'sources column missing';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_steps' AND column_name = 'learning_objectives') THEN
        RAISE EXCEPTION 'learning_objectives column missing';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_steps' AND column_name = 'prerequisites') THEN
        RAISE EXCEPTION 'prerequisites column missing';
    END IF;
    
    RAISE NOTICE '✅ All required columns exist';
END $$;

-- Test 2: Check constraints work correctly
DO $$
DECLARE
    test_uuid UUID := gen_random_uuid();
BEGIN
    -- Test valid step_type values
    INSERT INTO lesson_steps (
        id, collection_item_id, step_number, step_type, title
    ) VALUES (
        test_uuid, gen_random_uuid(), 1, 'assessment', 'Test Assessment Step'
    );
    
    DELETE FROM lesson_steps WHERE id = test_uuid;
    RAISE NOTICE '✅ assessment step_type accepted correctly';
    
    -- Test action_item step_type
    INSERT INTO lesson_steps (
        id, collection_item_id, step_number, step_type, title
    ) VALUES (
        test_uuid, gen_random_uuid(), 1, 'action_item', 'Test Action Item Step'
    );
    
    DELETE FROM lesson_steps WHERE id = test_uuid;
    RAISE NOTICE '✅ action_item step_type accepted correctly';
    
    -- Test all step types from the data
    INSERT INTO lesson_steps (
        id, collection_item_id, step_number, step_type, title
    ) VALUES 
        (gen_random_uuid(), gen_random_uuid(), 1, 'introduction', 'Test Introduction'),
        (gen_random_uuid(), gen_random_uuid(), 1, 'concept', 'Test Concept'),
        (gen_random_uuid(), gen_random_uuid(), 1, 'example', 'Test Example'),
        (gen_random_uuid(), gen_random_uuid(), 1, 'practice', 'Test Practice'),
        (gen_random_uuid(), gen_random_uuid(), 1, 'reflection', 'Test Reflection'),
        (gen_random_uuid(), gen_random_uuid(), 1, 'action', 'Test Action'),
        (gen_random_uuid(), gen_random_uuid(), 1, 'summary', 'Test Summary'),
        (gen_random_uuid(), gen_random_uuid(), 1, 'resources', 'Test Resources');
    
    -- Clean up test data
    DELETE FROM lesson_steps WHERE title LIKE 'Test %';
    RAISE NOTICE '✅ All step_type values accepted correctly';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Constraint test failed: %', SQLERRM;
END $$;

-- Test 3: Check JSON columns work correctly
DO $$
DECLARE
    test_uuid UUID := gen_random_uuid();
    test_sources JSONB;
    test_objectives JSONB;
    test_prerequisites JSONB;
BEGIN
    INSERT INTO lesson_steps (
        id, collection_item_id, step_number, step_type, title, content,
        sources, learning_objectives, prerequisites, key_concepts,
        interaction_config
    ) VALUES (
        test_uuid,
        gen_random_uuid(),
        1,
        'concept',
        'Test JSON Step',
        'Testing JSON columns',
        '[{"url": "https://example.com", "title": "Test Source"}]'::jsonb,
        '["Test objective 1", "Test objective 2"]'::jsonb,
        '["prerequisite-1"]'::jsonb,
        '["test-concept"]'::jsonb,
        '{"type": "test", "options": ["A", "B"]}'::jsonb
    );
    
    -- Verify JSON data was stored correctly
    SELECT sources, learning_objectives, prerequisites 
    INTO test_sources, test_objectives, test_prerequisites
    FROM lesson_steps WHERE id = test_uuid;
    
    IF jsonb_array_length(test_sources) != 1 THEN
        RAISE EXCEPTION 'Sources JSON not stored correctly';
    END IF;
    
    IF jsonb_array_length(test_objectives) != 2 THEN
        RAISE EXCEPTION 'Learning objectives JSON not stored correctly';
    END IF;
    
    -- Clean up
    DELETE FROM lesson_steps WHERE id = test_uuid;
    RAISE NOTICE '✅ JSON columns working correctly';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'JSON test failed: %', SQLERRM;
END $$;

-- Test 4: Check indexes exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_lesson_steps_collection_item_id') THEN
        RAISE EXCEPTION 'collection_item_id index missing';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_lesson_steps_step_type') THEN
        RAISE EXCEPTION 'step_type index missing';
    END IF;
    
    RAISE NOTICE '✅ All indexes created correctly';
END $$;

-- Display table structure summary
SELECT 
    'Table Structure Summary' as info,
    (SELECT count(*) FROM information_schema.columns WHERE table_name = 'lesson_steps') as column_count,
    (SELECT count(*) FROM information_schema.table_constraints WHERE table_name = 'lesson_steps') as constraint_count,
    (SELECT count(*) FROM pg_indexes WHERE tablename = 'lesson_steps') as index_count;

-- Display column details
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'lesson_steps' 
ORDER BY ordinal_position;

-- Display constraints
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'lesson_steps';

RAISE NOTICE '🎉 lesson_steps table verification completed successfully!';
RAISE NOTICE 'The table is ready to accept data from 3-lessons-column-fixed.sql';

COMMIT; 