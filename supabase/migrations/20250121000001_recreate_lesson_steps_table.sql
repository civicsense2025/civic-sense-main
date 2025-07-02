-- Recreate lesson_steps table with proper structure
-- Based on data from docs/collections/3-lessons-column-fixed.sql

BEGIN;

-- Drop existing table if it exists (use CASCADE to handle dependencies)
DROP TABLE IF EXISTS lesson_steps CASCADE;

-- Create the lesson_steps table with all required columns and constraints
CREATE TABLE lesson_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_item_id UUID NOT NULL,
    step_number INTEGER NOT NULL,
    step_type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    interaction_config JSONB DEFAULT '{}'::jsonb,
    estimated_seconds INTEGER DEFAULT 60,
    requires_interaction BOOLEAN DEFAULT false,
    can_skip BOOLEAN DEFAULT true,
    key_concepts JSONB DEFAULT '[]'::jsonb,
    sources JSONB DEFAULT '[]'::jsonb,
    learning_objectives JSONB DEFAULT '[]'::jsonb,
    prerequisites JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT lesson_steps_collection_item_id_fkey 
        FOREIGN KEY (collection_item_id) REFERENCES collection_items(id) ON DELETE CASCADE,
    
    -- Ensure step_type is valid - includes all types used in the data
    CONSTRAINT lesson_steps_step_type_check 
        CHECK (step_type IN (
            'introduction', 
            'concept', 
            'example', 
            'practice', 
            'reflection', 
            'action', 
            'assessment', 
            'summary', 
            'resources',
            'action_item'  -- Added from the SQL data
        )),
    
    -- Ensure step_number is positive
    CONSTRAINT lesson_steps_step_number_positive 
        CHECK (step_number > 0),
    
    -- Ensure estimated_seconds is reasonable
    CONSTRAINT lesson_steps_estimated_seconds_check 
        CHECK (estimated_seconds >= 0 AND estimated_seconds <= 7200), -- Max 2 hours per step
    
    -- Unique combination of collection_item_id and step_number
    CONSTRAINT lesson_steps_unique_step 
        UNIQUE (collection_item_id, step_number)
);

-- Create indexes for better performance
CREATE INDEX idx_lesson_steps_collection_item_id ON lesson_steps(collection_item_id);
CREATE INDEX idx_lesson_steps_step_number ON lesson_steps(step_number);
CREATE INDEX idx_lesson_steps_step_type ON lesson_steps(step_type);
CREATE INDEX idx_lesson_steps_requires_interaction ON lesson_steps(requires_interaction);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_lesson_steps_updated_at 
    BEFORE UPDATE ON lesson_steps 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE lesson_steps IS 'Individual steps within a lesson/collection item';
COMMENT ON COLUMN lesson_steps.collection_item_id IS 'References the lesson this step belongs to';
COMMENT ON COLUMN lesson_steps.step_number IS 'Order of the step within the lesson (1-based)';
COMMENT ON COLUMN lesson_steps.step_type IS 'Type of step: introduction, concept, example, practice, reflection, action, assessment, summary, resources, action_item';
COMMENT ON COLUMN lesson_steps.interaction_config IS 'JSON configuration for interactive elements';
COMMENT ON COLUMN lesson_steps.estimated_seconds IS 'Estimated time to complete this step in seconds';
COMMENT ON COLUMN lesson_steps.key_concepts IS 'Array of key concepts covered in this step';
COMMENT ON COLUMN lesson_steps.sources IS 'Array of source citations and references';
COMMENT ON COLUMN lesson_steps.learning_objectives IS 'Array of learning objectives for this step';
COMMENT ON COLUMN lesson_steps.prerequisites IS 'Array of prerequisite concepts/steps';

-- Enable Row Level Security (RLS)
ALTER TABLE lesson_steps ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "lesson_steps_read_policy" ON lesson_steps
    FOR SELECT USING (true); -- Allow public read access

CREATE POLICY "lesson_steps_write_policy" ON lesson_steps
    FOR ALL USING (
        auth.role() = 'service_role' OR 
        auth.jwt() ->> 'role' = 'admin'
    ); -- Only service role or admin can write

COMMIT; 