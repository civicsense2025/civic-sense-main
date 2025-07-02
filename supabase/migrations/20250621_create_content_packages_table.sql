-- ============================================================================
-- CREATE CONTENT PACKAGES TABLE FOR NEWS AI AGENT
-- Migration: 20250621_create_content_packages_table.sql
-- Purpose: Track AI-generated content packages from news analysis
-- ============================================================================

BEGIN;

-- Create content_packages table for tracking AI-generated content packages
CREATE TABLE IF NOT EXISTS public.content_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source information
  source_article_id TEXT,
  source_url TEXT,
  source_headline TEXT,
  source_domain TEXT,
  
  -- Package metadata
  package_name TEXT NOT NULL,
  description TEXT,
  civic_relevance_score INTEGER CHECK (civic_relevance_score >= 0 AND civic_relevance_score <= 100),
  
  -- Content types included
  content_types JSONB DEFAULT '{}',
  
  -- Quality metrics
  quality_scores JSONB DEFAULT '{}',
  
  -- Publication status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'rejected')),
  published_at TIMESTAMPTZ,
  published_content JSONB DEFAULT '{}',
  
  -- AI generation metadata
  ai_model TEXT,
  generation_method TEXT DEFAULT 'news_analysis',
  generation_config JSONB DEFAULT '{}',
  
  -- Standard audit fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_content_packages_status 
ON public.content_packages(status);

CREATE INDEX IF NOT EXISTS idx_content_packages_created_at 
ON public.content_packages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_packages_source_domain 
ON public.content_packages(source_domain);

CREATE INDEX IF NOT EXISTS idx_content_packages_civic_score 
ON public.content_packages(civic_relevance_score DESC);

-- Auto-update trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_content_packages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_content_packages_updated_at
    BEFORE UPDATE ON public.content_packages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_content_packages_updated_at();

-- Enable RLS
ALTER TABLE public.content_packages ENABLE ROW LEVEL SECURITY;

-- RLS policies for content packages
CREATE POLICY "Admins can manage all content packages" ON public.content_packages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Users can view published content packages" ON public.content_packages
    FOR SELECT USING (status = 'published');

COMMIT; 