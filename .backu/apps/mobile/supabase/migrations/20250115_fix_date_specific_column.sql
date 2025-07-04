-- Migration: Fix date_specific column type in source_metadata table
-- Date: 2025-01-15
-- Purpose: Correct the date_specific column to be a date string instead of boolean

BEGIN;

-- Drop the boolean version if it exists
ALTER TABLE public.source_metadata 
DROP COLUMN IF EXISTS date_specific;

-- Add date_specific as TEXT to store date strings (YYYY-MM-DD format)
ALTER TABLE public.source_metadata 
ADD COLUMN date_specific TEXT NULL;

-- Add index for performance on date_specific queries
CREATE INDEX IF NOT EXISTS idx_source_metadata_date_specific 
ON public.source_metadata(date_specific) 
WHERE date_specific IS NOT NULL;

-- Add index for date range queries
CREATE INDEX IF NOT EXISTS idx_source_metadata_published_time 
ON public.source_metadata(published_time DESC) 
WHERE published_time IS NOT NULL;

-- Update existing records to set date_specific based on published_time
UPDATE public.source_metadata 
SET date_specific = DATE(published_time)::TEXT
WHERE 
  published_time IS NOT NULL 
  AND published_time > '2020-01-01'::timestamp;

-- Add comment for documentation
COMMENT ON COLUMN public.source_metadata.date_specific IS 
'Date string (YYYY-MM-DD) indicating which specific date this news item is relevant for. NULL for general/evergreen news.';

COMMIT; 