-- Setup collections and collection_items for multi-step learning system
-- Based on course framework from docs/collections/3-lessons-column-fixed.sql

BEGIN;

-- Ensure collections table has the right structure for courses
-- Add any missing columns that might be needed for the course system
DO $$
BEGIN
    -- Add course-specific columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'collections' AND column_name = 'featured_order') THEN
        ALTER TABLE collections ADD COLUMN featured_order INTEGER DEFAULT NULL;
        CREATE INDEX IF NOT EXISTS idx_collections_featured_order ON collections(featured_order) WHERE featured_order IS NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'collections' AND column_name = 'difficulty_level') THEN
        ALTER TABLE collections ADD COLUMN difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 4);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'collections' AND column_name = 'course_category') THEN
        ALTER TABLE collections ADD COLUMN course_category TEXT CHECK (course_category IN ('foundational', 'skills-building', 'advanced', 'current-events'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'collections' AND column_name = 'estimated_duration_minutes') THEN
        ALTER TABLE collections ADD COLUMN estimated_duration_minutes INTEGER DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'collections' AND column_name = 'learning_objectives') THEN
        ALTER TABLE collections ADD COLUMN learning_objectives JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Ensure collection_items table has the right structure for lessons
-- Add any missing columns needed for lesson management
DO $$
BEGIN
    -- Ensure content_type includes 'lesson' 
    -- First check if the constraint exists and what it allows
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name LIKE '%content_type%' 
        AND table_name = 'collection_items'
    ) THEN
        -- Drop existing content_type constraint
        ALTER TABLE collection_items DROP CONSTRAINT IF EXISTS collection_items_content_type_check;
        -- Add updated constraint that includes lesson and topic
        ALTER TABLE collection_items ADD CONSTRAINT collection_items_content_type_check 
            CHECK (content_type IN ('topic', 'lesson', 'quiz', 'article', 'video', 'audio', 'assessment'));
    END IF;

    -- Add lesson-specific columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'collection_items' AND column_name = 'lesson_type') THEN
        ALTER TABLE collection_items ADD COLUMN lesson_type TEXT DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'collection_items' AND column_name = 'estimated_duration_minutes') THEN
        ALTER TABLE collection_items ADD COLUMN estimated_duration_minutes INTEGER DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'collection_items' AND column_name = 'prerequisites') THEN
        ALTER TABLE collection_items ADD COLUMN prerequisites JSONB DEFAULT '[]'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'collection_items' AND column_name = 'learning_objectives') THEN
        ALTER TABLE collection_items ADD COLUMN learning_objectives JSONB DEFAULT '[]'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'collection_items' AND column_name = 'key_concepts') THEN
        ALTER TABLE collection_items ADD COLUMN key_concepts JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Create indexes for better performance on course/lesson queries
CREATE INDEX IF NOT EXISTS idx_collections_category_difficulty ON collections(course_category, difficulty_level);
CREATE INDEX IF NOT EXISTS idx_collections_slug_featured ON collections(slug, featured_order);
CREATE INDEX IF NOT EXISTS idx_collection_items_content_type_sort ON collection_items(content_type, sort_order);
CREATE INDEX IF NOT EXISTS idx_collection_items_lesson_type ON collection_items(lesson_type) WHERE lesson_type IS NOT NULL;

-- Create a view for course structure with lesson counts
CREATE OR REPLACE VIEW course_structure AS
SELECT 
    c.id as collection_id,
    c.title as course_title,
    c.slug,
    c.description,
    c.difficulty_level,
    c.course_category,
    c.featured_order,
    c.estimated_duration_minutes as course_duration_minutes,
    c.learning_objectives as course_learning_objectives,
    COUNT(ci.id) as lesson_count,
    SUM(ci.estimated_duration_minutes) as calculated_duration_minutes,
    COUNT(ls.id) as total_steps,
    COUNT(CASE WHEN ls.requires_interaction THEN 1 END) as interactive_steps,
    ROUND(AVG(ls.estimated_seconds)) as avg_step_duration_seconds
FROM collections c
LEFT JOIN collection_items ci ON c.id = ci.collection_id 
    AND ci.content_type IN ('lesson', 'topic')
    AND ci.sort_order < 100  -- Exclude special items like summaries
LEFT JOIN lesson_steps ls ON ci.id = ls.collection_item_id
WHERE c.course_category IS NOT NULL  -- Only include actual courses
GROUP BY c.id, c.title, c.slug, c.description, c.difficulty_level, c.course_category, 
         c.featured_order, c.estimated_duration_minutes, c.learning_objectives;

-- Create a view for lesson structure with step details
CREATE OR REPLACE VIEW lesson_structure AS
SELECT 
    ci.id as lesson_id,
    ci.collection_id,
    ci.title as lesson_title,
    ci.description as lesson_description,
    ci.sort_order as lesson_order,
    ci.content_type,
    ci.lesson_type,
    ci.estimated_duration_minutes as lesson_duration_minutes,
    ci.learning_objectives as lesson_learning_objectives,
    ci.key_concepts as lesson_key_concepts,
    COUNT(ls.id) as step_count,
    COUNT(CASE WHEN ls.requires_interaction THEN 1 END) as interactive_step_count,
    SUM(ls.estimated_seconds) as total_estimated_seconds,
    ROUND(SUM(ls.estimated_seconds) / 60.0, 1) as calculated_duration_minutes,
    json_agg(
        json_build_object(
            'step_number', ls.step_number,
            'step_type', ls.step_type,
            'title', ls.title,
            'requires_interaction', ls.requires_interaction,
            'estimated_seconds', ls.estimated_seconds
        ) ORDER BY ls.step_number
    ) as steps_summary
FROM collection_items ci
LEFT JOIN lesson_steps ls ON ci.id = ls.collection_item_id
WHERE ci.content_type IN ('lesson', 'topic')
GROUP BY ci.id, ci.collection_id, ci.title, ci.description, ci.sort_order, 
         ci.content_type, ci.lesson_type, ci.estimated_duration_minutes, 
         ci.learning_objectives, ci.key_concepts;

-- Create function to get complete course structure
CREATE OR REPLACE FUNCTION get_course_structure(p_course_slug TEXT)
RETURNS TABLE (
    course_info JSONB,
    lessons JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        jsonb_build_object(
            'id', cs.collection_id,
            'title', cs.course_title,
            'slug', cs.slug,
            'description', cs.description,
            'difficulty_level', cs.difficulty_level,
            'course_category', cs.course_category,
            'featured_order', cs.featured_order,
            'lesson_count', cs.lesson_count,
            'total_steps', cs.total_steps,
            'interactive_steps', cs.interactive_steps,
            'estimated_duration_minutes', COALESCE(cs.course_duration_minutes, cs.calculated_duration_minutes),
            'learning_objectives', cs.course_learning_objectives
        ) as course_info,
        jsonb_agg(
            jsonb_build_object(
                'lesson_id', ls.lesson_id,
                'title', ls.lesson_title,
                'description', ls.lesson_description,
                'lesson_order', ls.lesson_order,
                'lesson_type', ls.lesson_type,
                'step_count', ls.step_count,
                'interactive_step_count', ls.interactive_step_count,
                'estimated_duration_minutes', COALESCE(ls.lesson_duration_minutes, ls.calculated_duration_minutes),
                'learning_objectives', ls.lesson_learning_objectives,
                'key_concepts', ls.lesson_key_concepts,
                'steps_summary', ls.steps_summary
            ) ORDER BY ls.lesson_order
        ) as lessons
    FROM course_structure cs
    LEFT JOIN lesson_structure ls ON cs.collection_id = ls.collection_id
    WHERE cs.slug = p_course_slug
    GROUP BY cs.collection_id, cs.course_title, cs.slug, cs.description, 
             cs.difficulty_level, cs.course_category, cs.featured_order, 
             cs.lesson_count, cs.total_steps, cs.interactive_steps,
             cs.course_duration_minutes, cs.calculated_duration_minutes,
             cs.course_learning_objectives;
END;
$$ LANGUAGE plpgsql;

-- Create function to validate course prerequisites
CREATE OR REPLACE FUNCTION check_course_prerequisites(p_user_id UUID, p_course_slug TEXT)
RETURNS TABLE (
    can_access BOOLEAN,
    missing_prerequisites JSONB,
    user_progress JSONB
) AS $$
DECLARE
    course_difficulty INTEGER;
    foundational_courses_completed INTEGER;
BEGIN
    -- Get course difficulty level
    SELECT difficulty_level INTO course_difficulty 
    FROM collections 
    WHERE slug = p_course_slug;
    
    -- Count completed foundational courses for this user
    -- This is a placeholder - you'd need to implement actual progress tracking
    foundational_courses_completed := 0;
    
    -- Simple prerequisite logic based on course framework
    RETURN QUERY
    SELECT 
        CASE 
            WHEN course_difficulty = 1 THEN true  -- Foundational courses always accessible
            WHEN course_difficulty = 2 THEN foundational_courses_completed >= 1  -- Need at least 1 foundational
            WHEN course_difficulty = 3 THEN foundational_courses_completed >= 2  -- Need multiple foundational
            WHEN course_difficulty = 4 THEN foundational_courses_completed >= 2  -- Advanced requirements
            ELSE false
        END as can_access,
        '[]'::jsonb as missing_prerequisites,  -- Placeholder
        '{}'::jsonb as user_progress;  -- Placeholder
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON VIEW course_structure IS 'Complete course information with lesson and step counts';
COMMENT ON VIEW lesson_structure IS 'Detailed lesson information with step breakdown';
COMMENT ON FUNCTION get_course_structure IS 'Returns complete course structure including lessons and steps for a given course slug';
COMMENT ON FUNCTION check_course_prerequisites IS 'Validates if a user meets prerequisites for a specific course';

-- Update RLS policies for the new columns
-- Policies should already exist from previous migrations, but ensure they cover new columns
CREATE POLICY IF NOT EXISTS "collections_public_read" ON collections
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "collection_items_public_read" ON collection_items
    FOR SELECT USING (true);

-- Grant permissions for the views and functions
GRANT SELECT ON course_structure TO authenticated, anon;
GRANT SELECT ON lesson_structure TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_course_structure TO authenticated, anon;
GRANT EXECUTE ON FUNCTION check_course_prerequisites TO authenticated, anon;

-- Verify the setup
DO $$
BEGIN
    -- Check that we can query the course structure
    IF EXISTS (SELECT 1 FROM course_structure LIMIT 1) OR NOT EXISTS (SELECT 1 FROM collections LIMIT 1) THEN
        RAISE NOTICE 'Course structure view created successfully';
    ELSE
        RAISE WARNING 'Course structure view may not be working correctly';
    END IF;
    
    -- Check that content_type constraint was updated
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name LIKE '%content_type%' 
        AND table_name = 'collection_items'
        AND check_clause LIKE '%lesson%'
    ) THEN
        RAISE NOTICE 'Collection items content_type constraint updated successfully';
    ELSE
        RAISE WARNING 'Collection items content_type constraint may not include lesson type';
    END IF;
END $$;

COMMIT; 