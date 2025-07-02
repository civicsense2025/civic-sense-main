-- Create user_assessment_attempts table
-- This table stores user attempts at civic assessments (like civics test)

CREATE TABLE IF NOT EXISTS public.user_assessment_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assessment_type TEXT NOT NULL DEFAULT 'civics_test',
    score INTEGER NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    time_spent_seconds INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    level_achieved TEXT DEFAULT 'novice',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_assessment_attempts_user_id ON public.user_assessment_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_assessment_attempts_completed_at ON public.user_assessment_attempts(completed_at);
CREATE INDEX IF NOT EXISTS idx_user_assessment_attempts_assessment_type ON public.user_assessment_attempts(assessment_type);

-- Enable RLS
ALTER TABLE public.user_assessment_attempts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own assessment attempts" ON public.user_assessment_attempts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assessment attempts" ON public.user_assessment_attempts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assessment attempts" ON public.user_assessment_attempts
    FOR UPDATE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.user_assessment_attempts TO authenticated;
GRANT SELECT ON public.user_assessment_attempts TO anon;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_assessment_attempts_updated_at
    BEFORE UPDATE ON public.user_assessment_attempts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at(); 