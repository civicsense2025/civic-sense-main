-- Create the question_skill_mappings table to map questions to skills
CREATE TABLE IF NOT EXISTS question_skill_mappings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id TEXT NOT NULL,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    relevance_score FLOAT NOT NULL DEFAULT 1.0 CHECK (relevance_score BETWEEN 0.0 AND 1.0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Each question-skill pair should be unique
    UNIQUE(question_id, skill_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_question_skill_mappings_question_id ON question_skill_mappings(question_id);
CREATE INDEX IF NOT EXISTS idx_question_skill_mappings_skill_id ON question_skill_mappings(skill_id);

-- Create updated_at trigger
DROP TRIGGER IF EXISTS update_question_skill_mappings_updated_at ON question_skill_mappings;
CREATE TRIGGER update_question_skill_mappings_updated_at 
    BEFORE UPDATE ON question_skill_mappings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE question_skill_mappings ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read
CREATE POLICY "Authenticated users can read question skill mappings" ON question_skill_mappings
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy for service role to manage
CREATE POLICY "Service role can manage question skill mappings" ON question_skill_mappings
    USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT ON question_skill_mappings TO authenticated;
GRANT ALL ON question_skill_mappings TO service_role;

-- Add comment for documentation
COMMENT ON TABLE question_skill_mappings IS 'Maps questions to skills for skill-based learning and assessment'; 