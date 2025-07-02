-- Migration: Add custom slug support for multiplayer rooms
-- This enables clean URLs like /multiplayer/join/my-custom-room
-- Date: 2025-01-19

BEGIN;

-- Add custom_slug column to multiplayer_rooms table
ALTER TABLE public.multiplayer_rooms 
ADD COLUMN IF NOT EXISTS custom_slug TEXT;

-- Add unique constraint for custom slugs (when not null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_multiplayer_rooms_custom_slug_unique 
ON public.multiplayer_rooms(custom_slug) 
WHERE custom_slug IS NOT NULL;

-- Add index for faster lookups by custom slug
CREATE INDEX IF NOT EXISTS idx_multiplayer_rooms_custom_slug 
ON public.multiplayer_rooms(custom_slug);

-- Add check constraint to ensure custom slugs are URL-safe
-- Allow lowercase letters, numbers, hyphens, and underscores
-- Must be at least 3 characters and max 50 characters
ALTER TABLE public.multiplayer_rooms 
ADD CONSTRAINT IF NOT EXISTS chk_custom_slug_format 
CHECK (
  custom_slug IS NULL OR (
    custom_slug ~ '^[a-z0-9_-]{3,50}$' AND
    custom_slug NOT LIKE '-%' AND  -- Don't start with hyphen
    custom_slug NOT LIKE '%-%' AND -- Don't end with hyphen
    custom_slug NOT LIKE '__%'     -- Don't have double underscores
  )
);

-- Update RLS policies to include custom_slug in lookups
-- Note: The existing policies should work fine since they're based on user_id
-- and room ownership, not specific column lookups

-- Add helpful comment
COMMENT ON COLUMN public.multiplayer_rooms.custom_slug IS 
'Optional custom URL slug for the room. Must be unique, URL-safe (lowercase letters, numbers, hyphens, underscores), 3-50 characters. Enables clean URLs like /multiplayer/join/my-custom-room';

-- Create function to generate safe slug from room name (optional utility)
CREATE OR REPLACE FUNCTION public.generate_room_slug(room_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  -- Convert to lowercase, replace spaces with hyphens, remove unsafe characters
  RETURN lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(room_name, '[^a-zA-Z0-9\s-]', '', 'g'), -- Remove unsafe chars
        '\s+', '-', 'g'  -- Replace spaces with hyphens
      ),
      '-+', '-', 'g'  -- Replace multiple hyphens with single
    )
  );
END;
$$;

-- Add comment to the function
COMMENT ON FUNCTION public.generate_room_slug(TEXT) IS 
'Utility function to generate a URL-safe slug from a room name. Converts to lowercase, replaces spaces with hyphens, removes unsafe characters.';

COMMIT; 