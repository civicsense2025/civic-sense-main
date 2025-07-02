-- Language Settings and Translation Jobs Migration
-- This migration adds comprehensive language and translation support

BEGIN;

-- Add user_preferences table for storing language settings
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    language_settings JSONB DEFAULT '{
        "uiLanguage": "en",
        "autoTranslateContent": true,
        "preserveCivicTerms": true,
        "autoSaveTranslations": true,
        "translationQuality": "enhanced",
        "fallbackLanguage": "en"
    }'::jsonb,
    accessibility_settings JSONB DEFAULT '{}',
    notification_settings JSONB DEFAULT '{}',
    privacy_settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Add translation_jobs table for managing bulk translation tasks
CREATE TABLE IF NOT EXISTS public.translation_jobs (
    id TEXT PRIMARY KEY,
    content_type TEXT NOT NULL CHECK (content_type IN ('question_topics', 'questions', 'news_articles', 'collections', 'public_figures')),
    target_language TEXT NOT NULL,
    requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
    settings JSONB DEFAULT '{}',
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
    message TEXT,
    progress_count INTEGER DEFAULT 0,
    total_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Add indexes for translation_jobs
CREATE INDEX IF NOT EXISTS idx_translation_jobs_status ON public.translation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_translation_jobs_user ON public.translation_jobs(requested_by);
CREATE INDEX IF NOT EXISTS idx_translation_jobs_language ON public.translation_jobs(target_language);
CREATE INDEX IF NOT EXISTS idx_translation_jobs_type ON public.translation_jobs(content_type);
CREATE INDEX IF NOT EXISTS idx_translation_jobs_created ON public.translation_jobs(created_at);

-- Enhanced translations table for better translation management
CREATE TABLE IF NOT EXISTS public.content_translations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_type TEXT NOT NULL,
    content_id TEXT NOT NULL,
    field_name TEXT NOT NULL,
    source_language TEXT NOT NULL DEFAULT 'en',
    target_language TEXT NOT NULL,
    source_text TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    quality_score DECIMAL(3,2) CHECK (quality_score >= 0 AND quality_score <= 1),
    translation_method TEXT NOT NULL DEFAULT 'automatic' CHECK (translation_method IN ('automatic', 'human', 'hybrid')),
    quality_level TEXT NOT NULL DEFAULT 'enhanced' CHECK (quality_level IN ('basic', 'enhanced', 'premium')),
    auto_translated BOOLEAN DEFAULT true,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    preserve_civic_terms BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(content_type, content_id, field_name, target_language)
);

-- Add indexes for content_translations
CREATE INDEX IF NOT EXISTS idx_content_translations_lookup ON public.content_translations(content_type, content_id, target_language);
CREATE INDEX IF NOT EXISTS idx_content_translations_language ON public.content_translations(target_language);
CREATE INDEX IF NOT EXISTS idx_content_translations_quality ON public.content_translations(quality_level, quality_score);
CREATE INDEX IF NOT EXISTS idx_content_translations_method ON public.content_translations(translation_method);

-- Add enhanced translation support to existing tables
-- Question Topics
DO $$ 
BEGIN 
    -- Add translations column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'question_topics' 
        AND column_name = 'translations'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.question_topics 
        ADD COLUMN translations JSONB DEFAULT '{}';
        
        CREATE INDEX IF NOT EXISTS idx_question_topics_translations 
        ON public.question_topics USING GIN (translations);
    END IF;
    
    -- Add translation metadata
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'question_topics' 
        AND column_name = 'translation_status'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.question_topics 
        ADD COLUMN translation_status JSONB DEFAULT '{}';
    END IF;
END $$;

-- Questions
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'questions' 
        AND column_name = 'translations'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.questions 
        ADD COLUMN translations JSONB DEFAULT '{}';
        
        CREATE INDEX IF NOT EXISTS idx_questions_translations 
        ON public.questions USING GIN (translations);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'questions' 
        AND column_name = 'translation_status'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.questions 
        ADD COLUMN translation_status JSONB DEFAULT '{}';
    END IF;
END $$;

-- News Articles
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'news_articles' 
        AND column_name = 'translations'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.news_articles 
        ADD COLUMN translations JSONB DEFAULT '{}';
        
        CREATE INDEX IF NOT EXISTS idx_news_articles_translations 
        ON public.news_articles USING GIN (translations);
    END IF;
END $$;

-- Public Figures
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'public_figures' 
        AND column_name = 'translations'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.public_figures 
        ADD COLUMN translations JSONB DEFAULT '{}';
        
        CREATE INDEX IF NOT EXISTS idx_public_figures_translations 
        ON public.public_figures USING GIN (translations);
    END IF;
END $$;

-- Function to get translation statistics
CREATE OR REPLACE FUNCTION public.get_translation_stats(target_language TEXT)
RETURNS JSON AS $$
DECLARE
    total_topics INTEGER;
    translated_topics INTEGER;
    total_questions INTEGER;
    translated_questions INTEGER;
    total_articles INTEGER;
    translated_articles INTEGER;
    result JSON;
BEGIN
    -- Count question topics
    SELECT COUNT(*) INTO total_topics FROM public.question_topics WHERE is_active = true;
    SELECT COUNT(*) INTO translated_topics 
    FROM public.question_topics 
    WHERE is_active = true 
    AND translations ? 'title' 
    AND translations->'title' ? target_language;
    
    -- Count questions
    SELECT COUNT(*) INTO total_questions FROM public.questions WHERE is_active = true;
    SELECT COUNT(*) INTO translated_questions 
    FROM public.questions 
    WHERE is_active = true 
    AND translations ? 'question_text' 
    AND translations->'question_text' ? target_language;
    
    -- Count news articles (last 30 days)
    SELECT COUNT(*) INTO total_articles 
    FROM public.news_articles 
    WHERE created_at > NOW() - INTERVAL '30 days';
    
    SELECT COUNT(*) INTO translated_articles 
    FROM public.news_articles 
    WHERE created_at > NOW() - INTERVAL '30 days'
    AND translations ? 'title' 
    AND translations->'title' ? target_language;
    
    -- Build result
    result := json_build_object(
        'totalContent', total_topics + total_questions + total_articles,
        'translatedContent', translated_topics + translated_questions + translated_articles,
        'pendingTranslations', (total_topics + total_questions + total_articles) - (translated_topics + translated_questions + translated_articles),
        'lastUpdated', NOW(),
        'breakdown', json_build_object(
            'topics', json_build_object(
                'total', total_topics,
                'translated', translated_topics
            ),
            'questions', json_build_object(
                'total', total_questions,
                'translated', translated_questions
            ),
            'articles', json_build_object(
                'total', total_articles,
                'translated', translated_articles
            )
        )
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clear translation cache
CREATE OR REPLACE FUNCTION public.clear_translation_cache(target_language TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Delete cached translations from content_translations table
    DELETE FROM public.content_translations 
    WHERE target_language = $1 AND auto_translated = true;
    
    -- Clear translations from main tables (optional - may want to keep these)
    -- This is commented out by default to preserve translations
    /*
    UPDATE public.question_topics 
    SET translations = translations - target_language 
    WHERE translations ? target_language;
    
    UPDATE public.questions 
    SET translations = translations - target_language 
    WHERE translations ? target_language;
    
    UPDATE public.news_articles 
    SET translations = translations - target_language 
    WHERE translations ? target_language;
    */
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_translations ENABLE ROW LEVEL SECURITY;

-- User preferences policies
CREATE POLICY "Users can manage their own preferences" ON public.user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Translation jobs policies
CREATE POLICY "Users can view their own translation jobs" ON public.translation_jobs
    FOR SELECT USING (auth.uid() = requested_by);

CREATE POLICY "Users can create translation jobs" ON public.translation_jobs
    FOR INSERT WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Admins can manage all translation jobs" ON public.translation_jobs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'translator')
        )
    );

-- Content translations policies
CREATE POLICY "Content translations are readable by all authenticated users" ON public.content_translations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Translators can manage translations" ON public.content_translations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'translator')
        )
    );

-- Add trigger for updated_at on user_preferences
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_translation_jobs_updated_at
    BEFORE UPDATE ON public.translation_jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_content_translations_updated_at
    BEFORE UPDATE ON public.content_translations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

COMMIT; 