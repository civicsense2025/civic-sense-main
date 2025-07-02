-- Update lesson_steps table for multi-step learning system
-- Based on step types used in docs/collections/3-lessons-column-fixed.sql

BEGIN;

-- First, check if lesson_steps table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lesson_steps') THEN
        RAISE EXCEPTION 'lesson_steps table does not exist. Please run the lesson_steps creation migration first.';
    END IF;
END $$;

-- Drop the existing step_type constraint
ALTER TABLE lesson_steps DROP CONSTRAINT IF EXISTS lesson_steps_step_type_check;

-- Add updated step_type constraint with all step types used in the course content
ALTER TABLE lesson_steps ADD CONSTRAINT lesson_steps_step_type_check 
    CHECK (step_type IN (
        'intro',           -- Introduction/hook steps
        'concept',         -- Concept explanation steps
        'example',         -- Real-world example steps
        'interaction',     -- Interactive quiz/game steps
        'action_item',     -- Civic engagement action steps
        'knowledge_check', -- Knowledge assessment steps
        'summary',         -- Summary/conclusion steps
        'introduction',    -- Legacy support
        'practice',        -- Legacy support
        'reflection',      -- Legacy support
        'action',          -- Legacy support
        'assessment',      -- Legacy support
        'resources'        -- Legacy support
    ));

-- Ensure the table has all required indexes for the multi-step learning system
CREATE INDEX IF NOT EXISTS idx_lesson_steps_collection_item_step 
    ON lesson_steps(collection_item_id, step_number);

CREATE INDEX IF NOT EXISTS idx_lesson_steps_step_type_interaction 
    ON lesson_steps(step_type, requires_interaction);

-- Add a function to validate lesson step progression
CREATE OR REPLACE FUNCTION validate_lesson_step_progression()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure step numbers are sequential within a collection item
    IF NOT EXISTS (
        SELECT 1 FROM lesson_steps 
        WHERE collection_item_id = NEW.collection_item_id 
        AND step_number = NEW.step_number - 1
    ) AND NEW.step_number > 1 THEN
        RAISE EXCEPTION 'Step number % must follow sequential order for collection_item_id %', 
            NEW.step_number, NEW.collection_item_id;
    END IF;
    
    -- Ensure no duplicate step numbers within same collection item
    IF EXISTS (
        SELECT 1 FROM lesson_steps 
        WHERE collection_item_id = NEW.collection_item_id 
        AND step_number = NEW.step_number 
        AND id != COALESCE(NEW.id, gen_random_uuid())
    ) THEN
        RAISE EXCEPTION 'Step number % already exists for collection_item_id %', 
            NEW.step_number, NEW.collection_item_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for step progression validation (but make it optional)
DROP TRIGGER IF EXISTS lesson_step_progression_trigger ON lesson_steps;
-- Note: Commenting out the trigger for now to allow flexible data insertion
-- CREATE TRIGGER lesson_step_progression_trigger
--     BEFORE INSERT OR UPDATE ON lesson_steps
--     FOR EACH ROW
--     EXECUTE FUNCTION validate_lesson_step_progression();

-- Create a function to get lesson progress statistics
CREATE OR REPLACE FUNCTION get_lesson_progress_stats(p_collection_item_id UUID)
RETURNS TABLE (
    total_steps INTEGER,
    interactive_steps INTEGER,
    estimated_total_minutes NUMERIC,
    step_types_breakdown JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_steps,
        COUNT(CASE WHEN requires_interaction THEN 1 END)::INTEGER as interactive_steps,
        ROUND(SUM(COALESCE(estimated_seconds, 60)) / 60.0, 1) as estimated_total_minutes,
        json_agg(
            json_build_object(
                'step_type', step_type,
                'count', count
            )
        )::JSONB as step_types_breakdown
    FROM (
        SELECT 
            step_type,
            COUNT(*) as count,
            requires_interaction,
            estimated_seconds
        FROM lesson_steps 
        WHERE collection_item_id = p_collection_item_id
        GROUP BY step_type, requires_interaction, estimated_seconds
    ) step_stats;
END;
$$ LANGUAGE plpgsql;

-- Update RLS policies to ensure proper access control
DROP POLICY IF EXISTS "lesson_steps_read_policy" ON lesson_steps;
DROP POLICY IF EXISTS "lesson_steps_write_policy" ON lesson_steps;

-- Allow public read access for lesson steps
CREATE POLICY "lesson_steps_public_read" ON lesson_steps
    FOR SELECT USING (true);

-- Allow authenticated users to create/update lesson steps
CREATE POLICY "lesson_steps_authenticated_write" ON lesson_steps
    FOR ALL USING (
        auth.role() = 'authenticated' OR 
        auth.role() = 'service_role' OR 
        auth.jwt() ->> 'role' = 'admin'
    );

-- Add helpful comments
COMMENT ON CONSTRAINT lesson_steps_step_type_check ON lesson_steps IS 
    'Allowed step types for multi-step learning: intro, concept, example, interaction, action_item, knowledge_check, summary, plus legacy types';

COMMENT ON FUNCTION get_lesson_progress_stats IS 
    'Returns statistics about lesson steps for a given collection item including total steps, interactive steps, and estimated duration';

COMMENT ON FUNCTION validate_lesson_step_progression IS 
    'Validates that lesson steps follow sequential numbering within a collection item';

-- Verify the constraint update worked
DO $$
BEGIN
    -- Test that the new step types are accepted
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'lesson_steps_step_type_check'
        AND check_clause LIKE '%intro%'
        AND check_clause LIKE '%action_item%'
        AND check_clause LIKE '%knowledge_check%'
    ) THEN
        RAISE WARNING 'Step type constraint may not have been updated correctly';
    ELSE
        RAISE NOTICE 'Step type constraint updated successfully with new step types';
    END IF;
END $$;

COMMIT; 