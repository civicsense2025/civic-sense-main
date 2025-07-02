-- Migration to fix congressional_photos schema for photo service compatibility
-- Add missing columns needed by CongressionalPhotoServiceLocal

-- Add missing columns to congressional_photos table
ALTER TABLE congressional_photos 
ADD COLUMN IF NOT EXISTS congress_number INTEGER;

ALTER TABLE congressional_photos 
ADD COLUMN IF NOT EXISTS local_path TEXT;

ALTER TABLE congressional_photos 
ADD COLUMN IF NOT EXISTS original_path TEXT;

-- Update existing records to have a default congress_number based on current congress (119th)
UPDATE congressional_photos 
SET congress_number = 119 
WHERE congress_number IS NULL;

-- Make congress_number NOT NULL after setting defaults
ALTER TABLE congressional_photos 
ALTER COLUMN congress_number SET NOT NULL;

-- Create a unique constraint on bioguide_id and congress_number
-- First, check if there's an existing unique constraint on bioguide_id that we need to drop
DO $$
BEGIN
    -- Drop existing unique constraint on bioguide_id if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'congressional_photos_bioguide_id_key'
    ) THEN
        ALTER TABLE congressional_photos DROP CONSTRAINT congressional_photos_bioguide_id_key;
    END IF;
END $$;

-- Create new unique constraint on bioguide_id + congress_number
ALTER TABLE congressional_photos 
ADD CONSTRAINT congressional_photos_bioguide_id_congress_number_key 
UNIQUE (bioguide_id, congress_number);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_congressional_photos_congress_number 
ON congressional_photos (congress_number);

CREATE INDEX IF NOT EXISTS idx_congressional_photos_bioguide_congress 
ON congressional_photos (bioguide_id, congress_number);

-- Add comments for documentation
COMMENT ON COLUMN congressional_photos.congress_number IS 'Congressional session number (e.g., 119 for 119th Congress)';
COMMENT ON COLUMN congressional_photos.local_path IS 'Base path for locally stored photos relative to public directory';
COMMENT ON COLUMN congressional_photos.original_path IS 'Path to original resolution photo file';

-- Update the update trigger if it exists
DROP TRIGGER IF EXISTS update_congressional_photos_updated_at ON congressional_photos;
CREATE TRIGGER update_congressional_photos_updated_at
    BEFORE UPDATE ON congressional_photos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 