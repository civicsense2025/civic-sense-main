-- Migration: Add date_specific column to source_metadata table
-- Date: 2025-01-15
-- Purpose: Fix NewsTicker component database errors

BEGIN;

-- Add date_specific column to source_metadata table
ALTER TABLE public.source_metadata 
ADD COLUMN IF NOT EXISTS date_specific BOOLEAN DEFAULT FALSE;

-- Add index for performance on date_specific queries
CREATE INDEX IF NOT EXISTS idx_source_metadata_date_specific 
ON public.source_metadata(date_specific) 
WHERE date_specific = true;

-- Update existing records to set appropriate date_specific values
-- Set to true for news items that appear to be date-specific based on content patterns
UPDATE public.source_metadata 
SET date_specific = true 
WHERE 
  date_specific IS NULL 
  AND (
    -- Mark as date-specific if URL contains date patterns
    url ~ '\/\d{4}\/\d{2}\/\d{2}\/' 
    OR url ~ '\/\d{4}-\d{2}-\d{2}[\/\-]'
    -- Mark as date-specific if title contains date references
    OR title ~ '\b(today|yesterday|this week|this month)\b'
    OR title ~ '\b\d{4}[-\/]\d{2}[-\/]\d{2}\b'
  );

-- Set default false for remaining records
UPDATE public.source_metadata 
SET date_specific = false 
WHERE date_specific IS NULL;

-- Make the column NOT NULL now that all records have values
ALTER TABLE public.source_metadata 
ALTER COLUMN date_specific SET NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.source_metadata.date_specific IS 
'Indicates whether this news item is specific to a particular date (true) or general news (false)';

COMMIT; 