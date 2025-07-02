-- ============================================================================
-- CivicSense Collections Schema - Multi-Step Learning System
-- Creates core tables for courses, lessons, and lesson steps
-- ============================================================================

BEGIN;

-- ============================================================================
-- COLLECTIONS TABLE (Courses/Learning Paths)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    slug TEXT UNIQUE NOT NULL,
    emoji TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    content_type TEXT DEFAULT 'course' CHECK (content_type IN ('course', 'playlist', 'module', 'series')),
    
    -- Course-specific fields
    featured_order INTEGER,
    difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 4),
    course_category TEXT CHECK (course_category IN ('foundational', 'skills-building', 'advanced', 'current-events')),
    estimated_duration_minutes INTEGER,
    learning_objectives JSONB,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Search and organization
    tags TEXT[],
    metadata JSONB
);

-- ============================================================================
-- COLLECTION_ITEMS TABLE (Lessons within Courses)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.collection_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
    
    -- Basic content fields
    title TEXT NOT NULL,
    description TEXT,
    content_type TEXT DEFAULT 'lesson' CHECK (content_type IN ('lesson', 'topic', 'quiz', 'assessment', 'resource', 'video', 'article')),
    
    -- Organization
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_required BOOLEAN DEFAULT TRUE,
    is_published BOOLEAN DEFAULT TRUE,
    
    -- Lesson-specific fields
    lesson_type TEXT CHECK (lesson_type IN ('interactive', 'reading', 'video', 'assessment', 'discussion')),
    estimated_duration_minutes INTEGER,
    prerequisites JSONB,
    learning_objectives JSONB,
    key_concepts JSONB,
    
    -- Content fields
    content TEXT,
    summary TEXT,
    
    -- External references
    topic_id TEXT,
    external_url TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Search and organization
    tags TEXT[],
    metadata JSONB,
    
    -- Unique constraint to prevent duplicate sort orders within a collection
    UNIQUE(collection_id, sort_order)
);

-- ============================================================================
-- LESSON_STEPS TABLE (Individual Steps within Lessons)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.lesson_steps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    collection_item_id UUID NOT NULL REFERENCES public.collection_items(id) ON DELETE CASCADE,
    
    -- Step organization
    step_number INTEGER NOT NULL,
    step_type TEXT NOT NULL CHECK (step_type IN (
        'intro', 'concept', 'example', 'interaction', 'action_item', 
        'knowledge_check', 'summary', 'assessment', 'reflection'
    )),
    
    -- Content
    title TEXT,
    content TEXT NOT NULL,
    
    -- Timing and flow
    estimated_seconds INTEGER,
    estimated_duration_minutes INTEGER,
    auto_advance_seconds INTEGER,
    requires_interaction BOOLEAN DEFAULT FALSE,
    can_skip BOOLEAN DEFAULT TRUE,
    
    -- Interactive elements
    interaction_config JSONB,
    skip_conditions JSONB,
    
    -- Media assets
    image_url TEXT,
    video_url TEXT,
    audio_url TEXT,
    alt_text TEXT,
    transcript TEXT,
    
    -- Learning data
    key_concepts JSONB,
    sources JSONB,
    
    -- Flow control
    next_step_id UUID REFERENCES public.lesson_steps(id) ON DELETE SET NULL,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Unique constraint to prevent duplicate step numbers within a lesson
    UNIQUE(collection_item_id, step_number)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Collections indexes
CREATE INDEX IF NOT EXISTS idx_collections_slug ON public.collections(slug);
CREATE INDEX IF NOT EXISTS idx_collections_featured ON public.collections(is_featured, featured_order) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_collections_difficulty ON public.collections(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_collections_category ON public.collections(course_category);
CREATE INDEX IF NOT EXISTS idx_collections_public ON public.collections(is_public) WHERE is_public = TRUE;

-- Collection items indexes
CREATE INDEX IF NOT EXISTS idx_collection_items_collection_id ON public.collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_sort_order ON public.collection_items(collection_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_collection_items_content_type ON public.collection_items(content_type);
CREATE INDEX IF NOT EXISTS idx_collection_items_published ON public.collection_items(is_published) WHERE is_published = TRUE;
CREATE INDEX IF NOT EXISTS idx_collection_items_topic_id ON public.collection_items(topic_id) WHERE topic_id IS NOT NULL;

-- Lesson steps indexes  
CREATE INDEX IF NOT EXISTS idx_lesson_steps_collection_item_id ON public.lesson_steps(collection_item_id);
CREATE INDEX IF NOT EXISTS idx_lesson_steps_step_number ON public.lesson_steps(collection_item_id, step_number);
CREATE INDEX IF NOT EXISTS idx_lesson_steps_step_type ON public.lesson_steps(step_type);
CREATE INDEX IF NOT EXISTS idx_lesson_steps_requires_interaction ON public.lesson_steps(step_type, requires_interaction) WHERE requires_interaction = TRUE;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_steps ENABLE ROW LEVEL SECURITY;

-- Collections policies
CREATE POLICY "collections_public_read" ON public.collections
    FOR SELECT USING (is_public = TRUE);

CREATE POLICY "collections_authenticated_read" ON public.collections
    FOR SELECT USING (
        is_public = TRUE OR 
        auth.uid() = created_by OR
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'educator')
        )
    );

CREATE POLICY "collections_admin_write" ON public.collections
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'educator')
        )
    );

-- Collection items policies
CREATE POLICY "collection_items_public_read" ON public.collection_items
    FOR SELECT USING (
        is_published = TRUE AND
        EXISTS (
            SELECT 1 FROM public.collections 
            WHERE id = collection_items.collection_id AND is_public = TRUE
        )
    );

CREATE POLICY "collection_items_authenticated_read" ON public.collection_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.collections 
            WHERE id = collection_items.collection_id AND (
                is_public = TRUE OR 
                created_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.user_roles 
                    WHERE user_id = auth.uid() AND role IN ('admin', 'educator')
                )
            )
        )
    );

CREATE POLICY "collection_items_admin_write" ON public.collection_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'educator')
        )
    );

-- Lesson steps policies
CREATE POLICY "lesson_steps_public_read" ON public.lesson_steps
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.collection_items ci
            JOIN public.collections c ON c.id = ci.collection_id
            WHERE ci.id = lesson_steps.collection_item_id 
            AND ci.is_published = TRUE 
            AND c.is_public = TRUE
        )
    );

CREATE POLICY "lesson_steps_authenticated_read" ON public.lesson_steps
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.collection_items ci
            JOIN public.collections c ON c.id = ci.collection_id
            WHERE ci.id = lesson_steps.collection_item_id 
            AND (
                c.is_public = TRUE OR 
                c.created_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.user_roles 
                    WHERE user_id = auth.uid() AND role IN ('admin', 'educator')
                )
            )
        )
    );

CREATE POLICY "lesson_steps_admin_write" ON public.lesson_steps
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'educator')
        )
    );

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER trigger_collections_updated_at
    BEFORE UPDATE ON public.collections
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_collection_items_updated_at
    BEFORE UPDATE ON public.collection_items
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_lesson_steps_updated_at
    BEFORE UPDATE ON public.lesson_steps
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- Course structure view with statistics
CREATE OR REPLACE VIEW public.course_structure AS
SELECT 
    c.id,
    c.title,
    c.slug,
    c.description,
    c.emoji,
    c.difficulty_level,
    c.course_category,
    c.estimated_duration_minutes,
    c.learning_objectives,
    c.is_public,
    c.is_featured,
    c.featured_order,
    COUNT(DISTINCT ci.id) as lesson_count,
    COUNT(DISTINCT ls.id) as total_steps,
    SUM(CASE WHEN ls.requires_interaction THEN 1 ELSE 0 END) as interactive_steps,
    SUM(ls.estimated_seconds) as total_estimated_seconds,
    ROUND(SUM(ls.estimated_seconds) / 60.0, 1) as estimated_minutes_calculated,
    c.created_at,
    c.updated_at
FROM public.collections c
LEFT JOIN public.collection_items ci ON c.id = ci.collection_id AND ci.is_published = TRUE
LEFT JOIN public.lesson_steps ls ON ci.id = ls.collection_item_id
WHERE c.content_type = 'course'
GROUP BY c.id, c.title, c.slug, c.description, c.emoji, c.difficulty_level, 
         c.course_category, c.estimated_duration_minutes, c.learning_objectives,
         c.is_public, c.is_featured, c.featured_order, c.created_at, c.updated_at;

-- Lesson structure view with step details
CREATE OR REPLACE VIEW public.lesson_structure AS
SELECT 
    ci.id as lesson_id,
    ci.collection_id,
    ci.title as lesson_title,
    ci.description as lesson_description,
    ci.sort_order,
    ci.lesson_type,
    ci.estimated_duration_minutes,
    ci.learning_objectives,
    ci.key_concepts,
    COUNT(ls.id) as step_count,
    SUM(CASE WHEN ls.requires_interaction THEN 1 ELSE 0 END) as interactive_step_count,
    SUM(ls.estimated_seconds) as total_step_seconds,
    ROUND(SUM(ls.estimated_seconds) / 60.0, 1) as calculated_duration_minutes,
    ci.is_published,
    ci.created_at,
    ci.updated_at
FROM public.collection_items ci
LEFT JOIN public.lesson_steps ls ON ci.id = ls.collection_item_id
WHERE ci.content_type = 'lesson'
GROUP BY ci.id, ci.collection_id, ci.title, ci.description, ci.sort_order,
         ci.lesson_type, ci.estimated_duration_minutes, ci.learning_objectives,
         ci.key_concepts, ci.is_published, ci.created_at, ci.updated_at;

-- ============================================================================
-- HELPER FUNCTIONS FOR COURSE MANAGEMENT
-- ============================================================================

-- Function to get complete course structure
CREATE OR REPLACE FUNCTION public.get_course_structure(course_slug TEXT)
RETURNS TABLE (
    course_id UUID,
    course_title TEXT,
    course_description TEXT,
    course_emoji TEXT,
    difficulty_level INTEGER,
    course_category TEXT,
    total_lessons INTEGER,
    total_steps INTEGER,
    estimated_duration_minutes NUMERIC,
    lessons JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as course_id,
        c.title as course_title,
        c.description as course_description,
        c.emoji as course_emoji,
        c.difficulty_level,
        c.course_category,
        COUNT(DISTINCT ci.id)::INTEGER as total_lessons,
        COUNT(DISTINCT ls.id)::INTEGER as total_steps,
        ROUND(SUM(ls.estimated_seconds) / 60.0, 1) as estimated_duration_minutes,
        COALESCE(
            jsonb_agg(
                DISTINCT jsonb_build_object(
                    'lesson_id', ci.id,
                    'title', ci.title,
                    'description', ci.description,
                    'sort_order', ci.sort_order,
                    'lesson_type', ci.lesson_type,
                    'step_count', (
                        SELECT COUNT(*) FROM public.lesson_steps ls2 
                        WHERE ls2.collection_item_id = ci.id
                    ),
                    'estimated_duration_minutes', ci.estimated_duration_minutes
                )
                ORDER BY ci.sort_order
            ) FILTER (WHERE ci.id IS NOT NULL),
            '[]'::jsonb
        ) as lessons
    FROM public.collections c
    LEFT JOIN public.collection_items ci ON c.id = ci.collection_id AND ci.is_published = TRUE
    LEFT JOIN public.lesson_steps ls ON ci.id = ls.collection_item_id
    WHERE c.slug = course_slug AND c.content_type = 'course'
    GROUP BY c.id, c.title, c.description, c.emoji, c.difficulty_level, c.course_category;
END;
$$ LANGUAGE plpgsql;

-- Function to validate lesson step progression
CREATE OR REPLACE FUNCTION public.validate_lesson_step_progression()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure step numbers are sequential within a lesson
    IF NEW.step_number <= 0 THEN
        RAISE EXCEPTION 'Step number must be greater than 0';
    END IF;
    
    -- Check if there's a gap in step numbers
    IF NEW.step_number > 1 AND NOT EXISTS (
        SELECT 1 FROM public.lesson_steps 
        WHERE collection_item_id = NEW.collection_item_id 
        AND step_number = NEW.step_number - 1
    ) THEN
        RAISE EXCEPTION 'Step numbers must be sequential. Missing step %', NEW.step_number - 1;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add validation trigger (commented out to avoid strict enforcement during development)
-- CREATE TRIGGER trigger_validate_lesson_step_progression
--     BEFORE INSERT OR UPDATE ON public.lesson_steps
--     FOR EACH ROW
--     EXECUTE FUNCTION public.validate_lesson_step_progression();

-- Function to get lesson progress statistics
CREATE OR REPLACE FUNCTION public.get_lesson_progress_stats(lesson_id UUID)
RETURNS TABLE (
    total_steps INTEGER,
    interactive_steps INTEGER,
    estimated_duration_minutes NUMERIC,
    step_types JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_steps,
        SUM(CASE WHEN requires_interaction THEN 1 ELSE 0 END)::INTEGER as interactive_steps,
        ROUND(SUM(estimated_seconds) / 60.0, 1) as estimated_duration_minutes,
        jsonb_object_agg(step_type, step_count) as step_types
    FROM (
        SELECT 
            step_type,
            requires_interaction,
            estimated_seconds,
            COUNT(*) as step_count
        FROM public.lesson_steps
        WHERE collection_item_id = lesson_id
        GROUP BY step_type, requires_interaction, estimated_seconds
    ) step_stats;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Verify tables were created successfully
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('collections', 'collection_items', 'lesson_steps')
ORDER BY tablename; 