-- Enhancement of glossary_terms table for CivicSense AI generation and branding
-- Migration: 20241221000000_enhance_glossary_terms.sql

BEGIN;

-- Add CivicSense-specific fields to glossary_terms table
ALTER TABLE public.glossary_terms 
ADD COLUMN IF NOT EXISTS difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
ADD COLUMN IF NOT EXISTS civicsense_priority INTEGER CHECK (civicsense_priority >= 1 AND civicsense_priority <= 10),
ADD COLUMN IF NOT EXISTS uncomfortable_truth TEXT,
ADD COLUMN IF NOT EXISTS power_dynamics TEXT[],
ADD COLUMN IF NOT EXISTS action_steps TEXT[],
ADD COLUMN IF NOT EXISTS source_content TEXT,
ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100);

-- Create AI generation jobs table for tracking AI-powered glossary generation
CREATE TABLE IF NOT EXISTS public.ai_generation_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('extract_from_content', 'generate_new', 'optimize_existing')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic')),
  input_data JSONB,
  results JSONB,
  error TEXT,
  cost DECIMAL(10, 6),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_glossary_terms_category ON public.glossary_terms(category);
CREATE INDEX IF NOT EXISTS idx_glossary_terms_quality_score ON public.glossary_terms(quality_score);
CREATE INDEX IF NOT EXISTS idx_glossary_terms_ai_generated ON public.glossary_terms(ai_generated);
CREATE INDEX IF NOT EXISTS idx_glossary_terms_difficulty ON public.glossary_terms(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_glossary_terms_active ON public.glossary_terms(is_active);

CREATE INDEX IF NOT EXISTS idx_ai_generation_jobs_user_status ON public.ai_generation_jobs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_generation_jobs_type_provider ON public.ai_generation_jobs(type, provider);
CREATE INDEX IF NOT EXISTS idx_ai_generation_jobs_created_at ON public.ai_generation_jobs(created_at DESC);

-- Add updated_at trigger for ai_generation_jobs
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ai_generation_jobs_updated_at
  BEFORE UPDATE ON public.ai_generation_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS on ai_generation_jobs
ALTER TABLE public.ai_generation_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies for ai_generation_jobs
CREATE POLICY "Users can view their own AI generation jobs" ON public.ai_generation_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own AI generation jobs" ON public.ai_generation_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI generation jobs" ON public.ai_generation_jobs
  FOR UPDATE USING (auth.uid() = user_id);

-- Sample data with CivicSense standards for testing
INSERT INTO public.glossary_terms (
  term, 
  definition, 
  category, 
  part_of_speech,
  examples,
  synonyms,
  uncomfortable_truth,
  power_dynamics,
  action_steps,
  quality_score,
  ai_generated,
  source_content,
  is_active
) VALUES 
(
  'Gerrymandering',
  'Politicians deliberately redraw voting district boundaries to ensure their party wins elections, regardless of voter preferences.',
  'voting',
  'noun',
  ARRAY['Maryland''s 3rd congressional district snakes through multiple counties', 'North Carolina Republicans drew maps giving them 10 of 13 seats with 53% of votes'],
  ARRAY['redistricting manipulation', 'electoral engineering'],
  'Both major parties manipulate district boundaries when they control redistricting, making most elections predetermined and voter choice largely meaningless.',
  ARRAY['State legislators draw their own district maps in most states', 'Politicians choose their voters instead of voters choosing politicians', 'Supreme Court ruled partisan gerrymandering is legal in 2019'],
  ARRAY['Support independent redistricting commissions in your state', 'Contact state representatives to demand transparent redistricting processes', 'Vote in state legislative elections that control redistricting', 'Join organizations like Common Cause or League of Women Voters', 'Attend public hearings on redistricting maps'],
  95,
  false,
  'CivicSense Editorial Team',
  true
),
(
  'Regulatory Capture',
  'Government regulatory agencies become controlled by the industries they are supposed to regulate, serving corporate interests instead of the public.',
  'power structures',
  'noun',
  ARRAY['Former pharmaceutical executives running the FDA', 'Oil industry veterans leading the EPA', 'Wall Street executives heading financial regulatory agencies'],
  ARRAY['agency capture', 'revolving door'],
  'The agencies meant to protect you from corporate harm are often run by the very people who used to profit from that harm.',
  ARRAY['Industry executives get appointed to lead regulatory agencies', 'Regulators often get high-paying jobs at companies they once regulated', 'Companies write their own regulations through industry associations'],
  ARRAY['Research the backgrounds of regulatory appointees', 'Contact senators during confirmation hearings', 'Support organizations that track regulatory capture', 'Vote for candidates who refuse corporate donations', 'Demand transparency in regulatory decision-making'],
  90,
  false,
  'CivicSense Editorial Team',
  true
)
ON CONFLICT (term) DO NOTHING;

COMMIT; 