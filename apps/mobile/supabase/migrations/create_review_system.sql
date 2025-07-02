-- ============================================================================
-- CIVICSENSE COMPREHENSIVE REVIEW SYSTEM SCHEMA
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CONTENT REVIEWS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.content_reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Content identification
    content_type TEXT NOT NULL CHECK (content_type IN (
        'topic', 'question', 'public_figure', 'collection', 
        'quiz_session', 'source', 'category'
    )),
    content_id TEXT NOT NULL,
    content_title TEXT NOT NULL,
    
    -- Review data
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    
    -- Community engagement
    helpful_count INTEGER DEFAULT 0 NOT NULL,
    not_helpful_count INTEGER DEFAULT 0 NOT NULL,
    
    -- Reviewer context
    is_verified_reviewer BOOLEAN DEFAULT FALSE NOT NULL,
    reviewer_expertise_level TEXT CHECK (reviewer_expertise_level IN (
        'beginner', 'intermediate', 'advanced', 'expert'
    )),
    
    -- Completion context (for post-completion reviews)
    completion_context JSONB DEFAULT '{}',
    -- Example: {
    --   "completed_at": "2024-01-15T10:30:00Z",
    --   "score": 85,
    --   "time_spent": 1800,
    --   "difficulty_experienced": "just_right"
    -- }
    
    -- Moderation
    is_public BOOLEAN DEFAULT TRUE NOT NULL,
    is_flagged BOOLEAN DEFAULT FALSE NOT NULL,
    moderator_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Ensure one review per user per content item
    UNIQUE(user_id, content_type, content_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_reviews_content ON public.content_reviews(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_reviews_user ON public.content_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_content_reviews_rating ON public.content_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_content_reviews_created ON public.content_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_reviews_public ON public.content_reviews(is_public, is_flagged) WHERE is_public = true AND is_flagged = false;

-- ============================================================================
-- REVIEW SUMMARIES TABLE (For performance caching)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.review_summaries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content_type TEXT NOT NULL,
    content_id TEXT NOT NULL,
    
    -- Aggregated data
    average_rating DECIMAL(3,2) DEFAULT 0.0 NOT NULL,
    total_reviews INTEGER DEFAULT 0 NOT NULL,
    
    -- Rating distribution
    rating_distribution JSONB DEFAULT '{
        "five_star": 0,
        "four_star": 0,
        "three_star": 0,
        "two_star": 0,
        "one_star": 0
    }' NOT NULL,
    
    -- Sentiment analysis (future enhancement)
    sentiment_summary JSONB DEFAULT '{}',
    -- Example: {
    --   "positive_themes": ["clear_explanations", "engaging_content"],
    --   "improvement_suggestions": ["more_interactive", "better_examples"],
    --   "common_praise": ["Well researched", "Easy to understand"],
    --   "common_complaints": ["Too basic", "Needs more depth"]
    -- }
    
    last_updated TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Ensure one summary per content item
    UNIQUE(content_type, content_id)
);

-- Indexes for review summaries
CREATE INDEX IF NOT EXISTS idx_review_summaries_content ON public.review_summaries(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_review_summaries_rating ON public.review_summaries(average_rating DESC);

-- ============================================================================
-- REVIEWER PROFILES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.reviewer_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Profile information
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    
    -- Expertise and credibility
    expertise_areas TEXT[] DEFAULT '{}' NOT NULL,
    civic_engagement_score INTEGER DEFAULT 0 NOT NULL CHECK (civic_engagement_score >= 0),
    
    -- Review statistics
    review_count INTEGER DEFAULT 0 NOT NULL,
    helpful_votes_received INTEGER DEFAULT 0 NOT NULL,
    average_review_quality_score DECIMAL(3,2) DEFAULT 0.0 NOT NULL,
    
    -- Verification status
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES auth.users(id),
    verification_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for reviewer profiles
CREATE INDEX IF NOT EXISTS idx_reviewer_profiles_user ON public.reviewer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_reviewer_profiles_verified ON public.reviewer_profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_reviewer_profiles_engagement ON public.reviewer_profiles(civic_engagement_score DESC);

-- ============================================================================
-- REVIEW HELPFULNESS VOTES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.review_helpfulness_votes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    review_id UUID NOT NULL REFERENCES public.content_reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    is_helpful BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Ensure one vote per user per review
    UNIQUE(review_id, user_id)
);

-- Indexes for helpfulness votes
CREATE INDEX IF NOT EXISTS idx_helpfulness_votes_review ON public.review_helpfulness_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_helpfulness_votes_user ON public.review_helpfulness_votes(user_id);

-- ============================================================================
-- REVIEW FLAGS TABLE (For moderation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.review_flags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    review_id UUID NOT NULL REFERENCES public.content_reviews(id) ON DELETE CASCADE,
    flagged_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    flag_reason TEXT NOT NULL CHECK (flag_reason IN (
        'spam', 'inappropriate', 'offensive', 'off_topic', 'false_information', 'other'
    )),
    flag_description TEXT,
    
    -- Moderation status
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN (
        'pending', 'reviewed', 'resolved', 'dismissed'
    )),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    moderator_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for review flags
CREATE INDEX IF NOT EXISTS idx_review_flags_review ON public.review_flags(review_id);
CREATE INDEX IF NOT EXISTS idx_review_flags_status ON public.review_flags(status);
CREATE INDEX IF NOT EXISTS idx_review_flags_flagged_by ON public.review_flags(flagged_by);

-- ============================================================================
-- REVIEW ANALYTICS TABLE (For insights and improvements)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.review_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content_type TEXT NOT NULL,
    content_id TEXT NOT NULL,
    
    -- Time period for the analytics
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    
    -- Metrics
    total_reviews INTEGER DEFAULT 0 NOT NULL,
    average_rating DECIMAL(3,2) DEFAULT 0.0 NOT NULL,
    
    -- Completion satisfaction (for learning content)
    completion_satisfaction_score DECIMAL(3,2) DEFAULT 0.0,
    
    -- Difficulty feedback distribution
    difficulty_feedback JSONB DEFAULT '{
        "too_easy": 0,
        "just_right": 0,
        "too_hard": 0
    }' NOT NULL,
    
    -- Engagement metrics
    reviews_with_text_percentage DECIMAL(5,2) DEFAULT 0.0,
    average_review_length INTEGER DEFAULT 0,
    
    -- Themes and insights (populated by analysis)
    positive_themes TEXT[] DEFAULT '{}',
    improvement_areas TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Ensure one analytics record per content per period
    UNIQUE(content_type, content_id, period_start, period_end)
);

-- Indexes for analytics
CREATE INDEX IF NOT EXISTS idx_review_analytics_content ON public.review_analytics(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_review_analytics_period ON public.review_analytics(period_start, period_end);

-- ============================================================================
-- FUNCTIONS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Function to update review summary when a review is added/updated/deleted
CREATE OR REPLACE FUNCTION public.update_review_summary()
RETURNS TRIGGER AS $$
DECLARE
    content_type_val TEXT;
    content_id_val TEXT;
    avg_rating DECIMAL(3,2);
    total_count INTEGER;
    rating_dist JSONB;
BEGIN
    -- Get content info from the affected row
    IF TG_OP = 'DELETE' THEN
        content_type_val := OLD.content_type;
        content_id_val := OLD.content_id;
    ELSE
        content_type_val := NEW.content_type;
        content_id_val := NEW.content_id;
    END IF;
    
    -- Calculate new statistics
    SELECT 
        COALESCE(AVG(rating), 0.0),
        COUNT(*),
        jsonb_build_object(
            'five_star', COUNT(*) FILTER (WHERE rating = 5),
            'four_star', COUNT(*) FILTER (WHERE rating = 4),
            'three_star', COUNT(*) FILTER (WHERE rating = 3),
            'two_star', COUNT(*) FILTER (WHERE rating = 2),
            'one_star', COUNT(*) FILTER (WHERE rating = 1)
        )
    INTO avg_rating, total_count, rating_dist
    FROM public.content_reviews
    WHERE content_type = content_type_val 
      AND content_id = content_id_val
      AND is_public = true 
      AND is_flagged = false;
    
    -- Upsert the summary
    INSERT INTO public.review_summaries (
        content_type, content_id, average_rating, total_reviews, rating_distribution, last_updated
    )
    VALUES (
        content_type_val, content_id_val, avg_rating, total_count, rating_dist, NOW()
    )
    ON CONFLICT (content_type, content_id)
    DO UPDATE SET
        average_rating = EXCLUDED.average_rating,
        total_reviews = EXCLUDED.total_reviews,
        rating_distribution = EXCLUDED.rating_distribution,
        last_updated = EXCLUDED.last_updated;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to update review helpfulness counts
CREATE OR REPLACE FUNCTION public.update_review_helpfulness_counts()
RETURNS TRIGGER AS $$
DECLARE
    review_id_val UUID;
    helpful_count INTEGER;
    not_helpful_count INTEGER;
BEGIN
    -- Get review ID from the affected row
    IF TG_OP = 'DELETE' THEN
        review_id_val := OLD.review_id;
    ELSE
        review_id_val := NEW.review_id;
    END IF;
    
    -- Calculate new counts
    SELECT 
        COUNT(*) FILTER (WHERE is_helpful = true),
        COUNT(*) FILTER (WHERE is_helpful = false)
    INTO helpful_count, not_helpful_count
    FROM public.review_helpfulness_votes
    WHERE review_id = review_id_val;
    
    -- Update the review
    UPDATE public.content_reviews
    SET 
        helpful_count = helpful_count,
        not_helpful_count = not_helpful_count,
        updated_at = NOW()
    WHERE id = review_id_val;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to update reviewer profile stats
CREATE OR REPLACE FUNCTION public.update_reviewer_profile_stats()
RETURNS TRIGGER AS $$
DECLARE
    user_id_val UUID;
    review_count INTEGER;
    helpful_votes INTEGER;
BEGIN
    -- Get user ID from the affected row
    IF TG_OP = 'DELETE' THEN
        user_id_val := OLD.user_id;
    ELSE
        user_id_val := NEW.user_id;
    END IF;
    
    -- Calculate stats
    SELECT 
        COUNT(*),
        COALESCE(SUM(helpful_count), 0)
    INTO review_count, helpful_votes
    FROM public.content_reviews
    WHERE user_id = user_id_val 
      AND is_public = true 
      AND is_flagged = false;
    
    -- Upsert reviewer profile
    INSERT INTO public.reviewer_profiles (
        user_id, review_count, helpful_votes_received, updated_at
    )
    VALUES (
        user_id_val, review_count, helpful_votes, NOW()
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
        review_count = EXCLUDED.review_count,
        helpful_votes_received = EXCLUDED.helpful_votes_received,
        updated_at = EXCLUDED.updated_at;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update review summary
DROP TRIGGER IF EXISTS trigger_update_review_summary ON public.content_reviews;
CREATE TRIGGER trigger_update_review_summary
    AFTER INSERT OR UPDATE OR DELETE ON public.content_reviews
    FOR EACH ROW EXECUTE FUNCTION public.update_review_summary();

-- Trigger to update helpfulness counts
DROP TRIGGER IF EXISTS trigger_update_helpfulness_counts ON public.review_helpfulness_votes;
CREATE TRIGGER trigger_update_helpfulness_counts
    AFTER INSERT OR UPDATE OR DELETE ON public.review_helpfulness_votes
    FOR EACH ROW EXECUTE FUNCTION public.update_review_helpfulness_counts();

-- Trigger to update reviewer profile stats
DROP TRIGGER IF EXISTS trigger_update_reviewer_stats ON public.content_reviews;
CREATE TRIGGER trigger_update_reviewer_stats
    AFTER INSERT OR UPDATE OR DELETE ON public.content_reviews
    FOR EACH ROW EXECUTE FUNCTION public.update_reviewer_profile_stats();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.content_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviewer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_helpfulness_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_analytics ENABLE ROW LEVEL SECURITY;

-- Content Reviews Policies
CREATE POLICY "content_reviews_select_public" ON public.content_reviews
    FOR SELECT USING (is_public = true AND is_flagged = false);

CREATE POLICY "content_reviews_select_own" ON public.content_reviews
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "content_reviews_insert_own" ON public.content_reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "content_reviews_update_own" ON public.content_reviews
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "content_reviews_delete_own" ON public.content_reviews
    FOR DELETE USING (auth.uid() = user_id);

-- Review Summaries Policies (read-only for users)
CREATE POLICY "review_summaries_select_all" ON public.review_summaries
    FOR SELECT USING (true);

-- Reviewer Profiles Policies
CREATE POLICY "reviewer_profiles_select_all" ON public.reviewer_profiles
    FOR SELECT USING (true);

CREATE POLICY "reviewer_profiles_update_own" ON public.reviewer_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Helpfulness Votes Policies
CREATE POLICY "helpfulness_votes_select_own" ON public.review_helpfulness_votes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "helpfulness_votes_insert_own" ON public.review_helpfulness_votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "helpfulness_votes_update_own" ON public.review_helpfulness_votes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "helpfulness_votes_delete_own" ON public.review_helpfulness_votes
    FOR DELETE USING (auth.uid() = user_id);

-- Review Flags Policies
CREATE POLICY "review_flags_select_own" ON public.review_flags
    FOR SELECT USING (auth.uid() = flagged_by);

CREATE POLICY "review_flags_insert_own" ON public.review_flags
    FOR INSERT WITH CHECK (auth.uid() = flagged_by);

-- Analytics Policies (read-only for authenticated users)
CREATE POLICY "review_analytics_select_authenticated" ON public.review_analytics
    FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- View for public reviews with reviewer info
CREATE OR REPLACE VIEW public.reviews_with_reviewer AS
SELECT 
    r.*,
    rp.display_name,
    rp.avatar_url,
    rp.is_verified,
    rp.expertise_areas,
    rp.civic_engagement_score
FROM public.content_reviews r
LEFT JOIN public.reviewer_profiles rp ON r.user_id = rp.user_id
WHERE r.is_public = true AND r.is_flagged = false;

-- View for content performance metrics
CREATE OR REPLACE VIEW public.content_performance AS
SELECT 
    rs.content_type,
    rs.content_id,
    rs.average_rating,
    rs.total_reviews,
    rs.rating_distribution,
    CASE 
        WHEN rs.total_reviews >= 10 THEN 'high_confidence'
        WHEN rs.total_reviews >= 5 THEN 'medium_confidence'
        WHEN rs.total_reviews >= 1 THEN 'low_confidence'
        ELSE 'no_data'
    END as confidence_level,
    rs.last_updated
FROM public.review_summaries rs;

-- ============================================================================
-- INITIAL DATA SETUP
-- ============================================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_reviews TO authenticated;
GRANT SELECT ON public.review_summaries TO authenticated;
GRANT SELECT, UPDATE ON public.reviewer_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.review_helpfulness_votes TO authenticated;
GRANT SELECT, INSERT ON public.review_flags TO authenticated;
GRANT SELECT ON public.review_analytics TO authenticated;
GRANT SELECT ON public.reviews_with_reviewer TO authenticated;
GRANT SELECT ON public.content_performance TO authenticated; 