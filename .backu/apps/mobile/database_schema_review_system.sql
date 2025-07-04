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
    
    last_updated TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Ensure one summary per content item
    UNIQUE(content_type, content_id)
);

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

-- ============================================================================
-- REVIEWER PROFILES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.reviewer_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Profile information
    display_name TEXT,
    avatar_url TEXT,
    
    -- Expertise and credibility
    expertise_areas TEXT[] DEFAULT '{}' NOT NULL,
    civic_engagement_score INTEGER DEFAULT 0 NOT NULL CHECK (civic_engagement_score >= 0),
    
    -- Review statistics
    review_count INTEGER DEFAULT 0 NOT NULL,
    helpful_votes_received INTEGER DEFAULT 0 NOT NULL,
    
    -- Verification status
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.content_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviewer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_helpfulness_votes ENABLE ROW LEVEL SECURITY;

-- Content Reviews Policies
CREATE POLICY "content_reviews_select_public" ON public.content_reviews
    FOR SELECT USING (is_public = true AND is_flagged = false);

CREATE POLICY "content_reviews_select_own" ON public.content_reviews
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "content_reviews_insert_own" ON public.content_reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "content_reviews_update_own" ON public.content_reviews
    FOR UPDATE USING (auth.uid() = user_id);

-- Review Summaries Policies (read-only for users)
CREATE POLICY "review_summaries_select_all" ON public.review_summaries
    FOR SELECT USING (true);

-- Reviewer Profiles Policies
CREATE POLICY "reviewer_profiles_select_all" ON public.reviewer_profiles
    FOR SELECT USING (true);

-- Helpfulness Votes Policies
CREATE POLICY "helpfulness_votes_select_own" ON public.review_helpfulness_votes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "helpfulness_votes_insert_own" ON public.review_helpfulness_votes
    FOR INSERT WITH CHECK (auth.uid() = user_id); 