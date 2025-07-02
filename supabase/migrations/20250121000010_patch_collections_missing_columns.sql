-- ============================================================================
-- CivicSense Collections Schema Patch - Add Missing Columns
-- Fixes missing columns needed for course content insertion
-- ============================================================================

BEGIN;

-- ============================================================================
-- PATCH COLLECTIONS TABLE
-- ============================================================================

-- Add missing columns that are used in the course insertion scripts
DO $$
BEGIN
    -- Add estimated_minutes as alias/alternative to estimated_duration_minutes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'collections' AND column_name = 'estimated_minutes') THEN
        ALTER TABLE public.collections 
        ADD COLUMN estimated_minutes INTEGER;
        
        -- Copy existing data from estimated_duration_minutes if it exists
        UPDATE public.collections 
        SET estimated_minutes = estimated_duration_minutes 
        WHERE estimated_duration_minutes IS NOT NULL;
    END IF;

    -- Ensure all expected columns exist with proper types
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'collections' AND column_name = 'learning_objectives') THEN
        ALTER TABLE public.collections ADD COLUMN learning_objectives TEXT[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'collections' AND column_name = 'action_items') THEN
        ALTER TABLE public.collections ADD COLUMN action_items TEXT[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'collections' AND column_name = 'categories') THEN
        ALTER TABLE public.collections ADD COLUMN categories TEXT[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'collections' AND column_name = 'tags') THEN
        ALTER TABLE public.collections ADD COLUMN tags TEXT[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'collections' AND column_name = 'status') THEN
        ALTER TABLE public.collections ADD COLUMN status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'collections' AND column_name = 'current_events_relevance') THEN
        ALTER TABLE public.collections ADD COLUMN current_events_relevance INTEGER DEFAULT 1 CHECK (current_events_relevance >= 1 AND current_events_relevance <= 5);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'collections' AND column_name = 'political_balance_score') THEN
        ALTER TABLE public.collections ADD COLUMN political_balance_score INTEGER DEFAULT 3 CHECK (political_balance_score >= 1 AND political_balance_score <= 5);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'collections' AND column_name = 'source_diversity_score') THEN
        ALTER TABLE public.collections ADD COLUMN source_diversity_score INTEGER DEFAULT 3 CHECK (source_diversity_score >= 1 AND source_diversity_score <= 5);
    END IF;

    -- Add comment column for internal notes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'collections' AND column_name = 'internal_notes') THEN
        ALTER TABLE public.collections ADD COLUMN internal_notes TEXT;
    END IF;

    -- Add publication date tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'collections' AND column_name = 'published_at') THEN
        ALTER TABLE public.collections ADD COLUMN published_at TIMESTAMPTZ;
    END IF;

    -- Add version tracking for content updates
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'collections' AND column_name = 'version') THEN
        ALTER TABLE public.collections ADD COLUMN version INTEGER DEFAULT 1;
    END IF;

    -- Add prerequisite tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'collections' AND column_name = 'prerequisites') THEN
        ALTER TABLE public.collections ADD COLUMN prerequisites TEXT[]; -- Array of collection slugs
    END IF;

END $$;

-- ============================================================================
-- PATCH COLLECTION_ITEMS TABLE
-- ============================================================================

DO $$
BEGIN
    -- Add content_id if it doesn't exist (for referencing specific topics/questions)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'collection_items' AND column_name = 'content_id') THEN
        ALTER TABLE public.collection_items ADD COLUMN content_id UUID;
    END IF;

    -- Add title and description overrides for collection-specific content
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'collection_items' AND column_name = 'title_override') THEN
        ALTER TABLE public.collection_items ADD COLUMN title_override TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'collection_items' AND column_name = 'description_override') THEN
        ALTER TABLE public.collection_items ADD COLUMN description_override TEXT;
    END IF;

    -- Add category for organizing items within collections
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'collection_items' AND column_name = 'category') THEN
        ALTER TABLE public.collection_items ADD COLUMN category TEXT;
    END IF;

    -- Add completion tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'collection_items' AND column_name = 'is_optional') THEN
        ALTER TABLE public.collection_items ADD COLUMN is_optional BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add prerequisite tracking at item level
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'collection_items' AND column_name = 'prerequisites') THEN
        ALTER TABLE public.collection_items ADD COLUMN prerequisites TEXT[]; -- Array of item IDs
    END IF;

    -- Add estimated time at item level
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'collection_items' AND column_name = 'estimated_minutes') THEN
        ALTER TABLE public.collection_items ADD COLUMN estimated_minutes INTEGER;
    END IF;

END $$;

-- ============================================================================
-- PATCH LESSON_STEPS TABLE
-- ============================================================================

DO $$
BEGIN
    -- Ensure all lesson_steps columns exist with proper constraints
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_steps' AND column_name = 'step_number') THEN
        ALTER TABLE public.lesson_steps ADD COLUMN step_number INTEGER NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_steps' AND column_name = 'step_type') THEN
        ALTER TABLE public.lesson_steps ADD COLUMN step_type TEXT NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_steps' AND column_name = 'title') THEN
        ALTER TABLE public.lesson_steps ADD COLUMN title TEXT NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_steps' AND column_name = 'content') THEN
        ALTER TABLE public.lesson_steps ADD COLUMN content TEXT NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_steps' AND column_name = 'interaction_config') THEN
        ALTER TABLE public.lesson_steps ADD COLUMN interaction_config JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_steps' AND column_name = 'estimated_seconds') THEN
        ALTER TABLE public.lesson_steps ADD COLUMN estimated_seconds INTEGER DEFAULT 30;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_steps' AND column_name = 'requires_interaction') THEN
        ALTER TABLE public.lesson_steps ADD COLUMN requires_interaction BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_steps' AND column_name = 'can_skip') THEN
        ALTER TABLE public.lesson_steps ADD COLUMN can_skip BOOLEAN DEFAULT TRUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_steps' AND column_name = 'key_concepts') THEN
        ALTER TABLE public.lesson_steps ADD COLUMN key_concepts JSONB;
    END IF;

    -- Add additional useful columns for lesson steps
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_steps' AND column_name = 'media_url') THEN
        ALTER TABLE public.lesson_steps ADD COLUMN media_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_steps' AND column_name = 'media_type') THEN
        ALTER TABLE public.lesson_steps ADD COLUMN media_type TEXT CHECK (media_type IN ('image', 'video', 'audio', 'document'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_steps' AND column_name = 'completion_criteria') THEN
        ALTER TABLE public.lesson_steps ADD COLUMN completion_criteria JSONB;
    END IF;

END $$;

-- ============================================================================
-- UPDATE CONSTRAINTS AND CHECKS
-- ============================================================================

-- Update or add step_type constraint to include all the types used in the course content
DO $$
BEGIN
    -- Drop existing constraint if it exists
    ALTER TABLE lesson_steps DROP CONSTRAINT IF EXISTS lesson_steps_step_type_check;
    
    -- Add comprehensive step_type constraint
    ALTER TABLE lesson_steps ADD CONSTRAINT lesson_steps_step_type_check 
    CHECK (step_type IN (
        'intro', 'concept', 'example', 'interaction', 'action_item', 
        'knowledge_check', 'summary', 'reflection', 'case_study',
        'timeline', 'comparison', 'simulation', 'debate', 'research'
    ));
END $$;

-- Update content_type constraint for collection_items
DO $$
BEGIN
    ALTER TABLE collection_items DROP CONSTRAINT IF EXISTS collection_items_content_type_check;
    
    ALTER TABLE collection_items ADD CONSTRAINT collection_items_content_type_check 
    CHECK (content_type IN (
        'topic', 'question', 'quiz', 'article', 'video', 'audio', 
        'document', 'simulation', 'game', 'assessment'
    ));
END $$;

-- ============================================================================
-- UPDATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Add indexes for new columns that will be frequently queried
CREATE INDEX IF NOT EXISTS idx_collections_status ON public.collections(status);
CREATE INDEX IF NOT EXISTS idx_collections_estimated_minutes ON public.collections(estimated_minutes);
CREATE INDEX IF NOT EXISTS idx_collections_published_at ON public.collections(published_at) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_collections_tags_gin ON public.collections USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_collections_categories_gin ON public.collections USING GIN(categories);

CREATE INDEX IF NOT EXISTS idx_collection_items_content_id ON public.collection_items(content_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_category ON public.collection_items(category);
CREATE INDEX IF NOT EXISTS idx_collection_items_optional ON public.collection_items(is_optional);

CREATE INDEX IF NOT EXISTS idx_lesson_steps_step_type ON public.lesson_steps(step_type);
CREATE INDEX IF NOT EXISTS idx_lesson_steps_interaction ON public.lesson_steps(requires_interaction) WHERE requires_interaction = true;
CREATE INDEX IF NOT EXISTS idx_lesson_steps_concepts_gin ON public.lesson_steps USING GIN(key_concepts);

-- ============================================================================
-- ADD HELPFUL VIEWS
-- ============================================================================

-- Create a view for published collections with calculated metrics
CREATE OR REPLACE VIEW public.published_collections AS
SELECT 
    c.*,
    COUNT(ci.id) as lesson_count,
    SUM(ci.estimated_minutes) as total_item_minutes,
    COUNT(ls.id) as total_steps,
    SUM(ls.estimated_seconds) as total_step_seconds,
    COUNT(CASE WHEN ls.requires_interaction THEN 1 END) as interactive_steps
FROM public.collections c
LEFT JOIN public.collection_items ci ON c.id = ci.collection_id
LEFT JOIN public.lesson_steps ls ON ci.id = ls.collection_item_id
WHERE c.status = 'published'
GROUP BY c.id;

-- Create a view for collection progress tracking
CREATE OR REPLACE VIEW public.collection_structure AS
SELECT 
    c.id as collection_id,
    c.title as collection_title,
    c.slug as collection_slug,
    ci.id as item_id,
    ci.sort_order as item_order,
    ci.title_override as item_title,
    ci.category as item_category,
    ls.id as step_id,
    ls.step_number,
    ls.step_type,
    ls.title as step_title,
    ls.estimated_seconds,
    ls.requires_interaction
FROM public.collections c
LEFT JOIN public.collection_items ci ON c.id = ci.collection_id
LEFT JOIN public.lesson_steps ls ON ci.id = ls.collection_item_id
ORDER BY c.slug, ci.sort_order, ls.step_number;

-- ============================================================================
-- ADD UTILITY FUNCTIONS
-- ============================================================================

-- Function to get collection statistics
CREATE OR REPLACE FUNCTION public.get_collection_stats(collection_slug TEXT)
RETURNS TABLE (
    lesson_count BIGINT,
    total_steps BIGINT,
    estimated_minutes NUMERIC,
    interactive_steps BIGINT,
    completion_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT ci.id) as lesson_count,
        COUNT(ls.id) as total_steps,
        ROUND(SUM(ls.estimated_seconds) / 60.0, 1) as estimated_minutes,
        COUNT(CASE WHEN ls.requires_interaction THEN 1 END) as interactive_steps,
        ROUND(100.0 * COUNT(CASE WHEN ls.requires_interaction THEN 1 END) / COUNT(ls.id), 1) as completion_rate
    FROM collections c
    LEFT JOIN collection_items ci ON c.id = ci.collection_id
    LEFT JOIN lesson_steps ls ON ci.id = ls.collection_item_id
    WHERE c.slug = collection_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to validate collection data integrity
CREATE OR REPLACE FUNCTION public.validate_collection_integrity(collection_id UUID)
RETURNS TABLE (
    issue_type TEXT,
    issue_description TEXT,
    severity TEXT
) AS $$
BEGIN
    -- Check for missing lesson steps
    RETURN QUERY
    SELECT 
        'missing_steps'::TEXT,
        'Collection item has no lesson steps: ' || ci.title_override,
        'warning'::TEXT
    FROM collection_items ci
    LEFT JOIN lesson_steps ls ON ci.id = ls.collection_item_id
    WHERE ci.collection_id = validate_collection_integrity.collection_id
    AND ls.id IS NULL;
    
    -- Check for broken step sequences
    RETURN QUERY
    SELECT 
        'sequence_gap'::TEXT,
        'Step number gap in item: ' || ci.title_override,
        'error'::TEXT
    FROM collection_items ci
    WHERE ci.collection_id = validate_collection_integrity.collection_id
    AND EXISTS (
        SELECT 1 FROM lesson_steps ls1
        WHERE ls1.collection_item_id = ci.id
        AND NOT EXISTS (
            SELECT 1 FROM lesson_steps ls2
            WHERE ls2.collection_item_id = ci.id
            AND ls2.step_number = ls1.step_number - 1
        )
        AND ls1.step_number > 1
    );
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify all expected columns now exist
DO $$
DECLARE
    missing_columns TEXT[];
    expected_collections_columns TEXT[] := ARRAY[
        'estimated_minutes', 'learning_objectives', 'action_items', 
        'categories', 'tags', 'status', 'current_events_relevance',
        'political_balance_score', 'source_diversity_score'
    ];
    col TEXT;
BEGIN
    FOREACH col IN ARRAY expected_collections_columns
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'collections' AND column_name = col
        ) THEN
            missing_columns := array_append(missing_columns, col);
        END IF;
    END LOOP;
    
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE EXCEPTION 'Missing columns in collections table: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE 'All required columns exist in collections table';
    END IF;
END $$;

-- Verification query
SELECT 
    'Patch migration completed successfully' as status,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'collections') as collections_columns,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'collection_items') as collection_items_columns,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'lesson_steps') as lesson_steps_columns; 