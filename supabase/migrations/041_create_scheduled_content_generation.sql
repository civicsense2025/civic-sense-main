-- Create scheduled_content_generation table for automated content generation
BEGIN;

CREATE TABLE IF NOT EXISTS scheduled_content_generation (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    schedule jsonb NOT NULL,
    generation_settings jsonb NOT NULL,
    last_run timestamptz,
    next_run timestamptz,
    created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE scheduled_content_generation ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own scheduled generations
CREATE POLICY "Users can view own scheduled generations" 
    ON scheduled_content_generation FOR SELECT 
    USING (auth.uid() = created_by);

-- Policy: Users can create their own scheduled generations
CREATE POLICY "Users can create own scheduled generations" 
    ON scheduled_content_generation FOR INSERT 
    WITH CHECK (auth.uid() = created_by);

-- Policy: Users can update their own scheduled generations
CREATE POLICY "Users can update own scheduled generations" 
    ON scheduled_content_generation FOR UPDATE 
    USING (auth.uid() = created_by);

-- Policy: Users can delete their own scheduled generations
CREATE POLICY "Users can delete own scheduled generations" 
    ON scheduled_content_generation FOR DELETE 
    USING (auth.uid() = created_by);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_content_generation_created_by 
    ON scheduled_content_generation(created_by);

CREATE INDEX IF NOT EXISTS idx_scheduled_content_generation_next_run 
    ON scheduled_content_generation(next_run) 
    WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_scheduled_content_generation_active 
    ON scheduled_content_generation(is_active, next_run);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_scheduled_content_generation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_scheduled_content_generation_updated_at ON scheduled_content_generation;
CREATE TRIGGER update_scheduled_content_generation_updated_at
    BEFORE UPDATE ON scheduled_content_generation
    FOR EACH ROW
    EXECUTE PROCEDURE update_scheduled_content_generation_updated_at();

-- Add comments for documentation
COMMENT ON TABLE scheduled_content_generation IS 'Stores automated content generation schedules and configurations';
COMMENT ON COLUMN scheduled_content_generation.name IS 'Human-readable name for this scheduled generation';
COMMENT ON COLUMN scheduled_content_generation.is_active IS 'Whether this schedule is currently active';
COMMENT ON COLUMN scheduled_content_generation.schedule IS 'Schedule configuration (interval, time, timezone)';
COMMENT ON COLUMN scheduled_content_generation.generation_settings IS 'Content generation parameters (questions per topic, distributions, etc.)';
COMMENT ON COLUMN scheduled_content_generation.last_run IS 'When this schedule was last executed';
COMMENT ON COLUMN scheduled_content_generation.next_run IS 'When this schedule should next be executed';
COMMENT ON COLUMN scheduled_content_generation.created_by IS 'User who created this schedule';

COMMIT; 