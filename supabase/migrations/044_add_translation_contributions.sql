-- Migration to add translation contributions table
-- This table stores user-contributed translations for review and integration

BEGIN;

-- Create translation contributions table
CREATE TABLE IF NOT EXISTS public.pending_translations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Content identification
    content_type TEXT NOT NULL CHECK (content_type IN ('question', 'topic')),
    content_id TEXT NOT NULL,
    
    -- Translation details
    target_language TEXT NOT NULL,
    translations JSONB NOT NULL,
    
    -- Contributor information
    contributor_name TEXT NOT NULL,
    contributor_email TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- AI/DeepL integration metadata
    metadata JSONB DEFAULT '{}',
    
    -- Review and moderation
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'integrated')),
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    reviewer_feedback TEXT,
    
    -- Quality scoring
    quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 5),
    auto_translated BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Prevent duplicate contributions
    UNIQUE(content_type, content_id, target_language, contributor_email)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pending_translations_content 
ON public.pending_translations(content_type, content_id);

CREATE INDEX IF NOT EXISTS idx_pending_translations_status 
ON public.pending_translations(status);

CREATE INDEX IF NOT EXISTS idx_pending_translations_language 
ON public.pending_translations(target_language);

CREATE INDEX IF NOT EXISTS idx_pending_translations_user 
ON public.pending_translations(user_id);

CREATE INDEX IF NOT EXISTS idx_pending_translations_created 
ON public.pending_translations(created_at DESC);

-- Enable RLS
ALTER TABLE public.pending_translations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Contributors can view their own contributions
CREATE POLICY "pending_translations_own_view" ON public.pending_translations
    FOR SELECT USING (
        user_id = auth.uid() OR 
        contributor_email = auth.email()
    );

-- Anyone can insert contributions (for anonymous contributors)
CREATE POLICY "pending_translations_insert" ON public.pending_translations
    FOR INSERT WITH CHECK (true);

-- Only admins can update/review contributions
CREATE POLICY "pending_translations_admin_manage" ON public.pending_translations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Admins can view all contributions
CREATE POLICY "pending_translations_admin_view" ON public.pending_translations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_translation_contribution_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_pending_translations_updated_at ON public.pending_translations;
CREATE TRIGGER trigger_pending_translations_updated_at
    BEFORE UPDATE ON public.pending_translations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_translation_contribution_updated_at();

-- Create function to validate translation structure
CREATE OR REPLACE FUNCTION public.validate_contribution_translations(translations JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check that translations is an object
    IF jsonb_typeof(translations) != 'object' THEN
        RETURN FALSE;
    END IF;
    
    -- Check that all values are non-empty strings
    RETURN NOT EXISTS (
        SELECT 1 
        FROM jsonb_each_text(translations) 
        WHERE value IS NULL OR value = ''
    );
END;
$$ LANGUAGE plpgsql;

-- Add constraint to validate translations format
ALTER TABLE public.pending_translations 
ADD CONSTRAINT check_translations_format 
CHECK (public.validate_contribution_translations(translations));

-- Create helper function to get pending contributions count
CREATE OR REPLACE FUNCTION public.get_pending_contributions_count()
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER 
        FROM public.pending_translations 
        WHERE status = 'pending'
    );
END;
$$ LANGUAGE plpgsql;

-- Create helper function to approve a contribution and integrate it
CREATE OR REPLACE FUNCTION public.approve_translation_contribution(
    contribution_id UUID,
    reviewer_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
DECLARE
    contribution RECORD;
    target_table TEXT;
BEGIN
    -- Get the contribution
    SELECT * INTO contribution 
    FROM public.pending_translations 
    WHERE id = contribution_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Determine target table
    target_table := CASE contribution.content_type
        WHEN 'question' THEN 'questions'
        WHEN 'topic' THEN 'question_topics'
        ELSE NULL
    END;
    
    IF target_table IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Update the contribution status
    UPDATE public.pending_translations 
    SET 
        status = 'approved',
        reviewed_by = reviewer_id,
        reviewed_at = NOW()
    WHERE id = contribution_id;
    
    -- TODO: Integration with actual content tables would happen here
    -- This would use the set_translation helper function from migration 043
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMIT; 