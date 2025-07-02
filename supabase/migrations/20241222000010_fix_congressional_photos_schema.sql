-- Fix Congressional Photos Schema for Local Storage Support
-- Migration: 20241222000010_fix_congressional_photos_schema.sql

BEGIN;

-- Drop existing table if it exists to start fresh
DROP TABLE IF EXISTS public.congressional_photos CASCADE;

-- Create enhanced congressional_photos table with congress support
CREATE TABLE public.congressional_photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES public.public_figures(id) ON DELETE CASCADE,
    bioguide_id TEXT NOT NULL,
    congress_number INTEGER NOT NULL,
    
    -- Local storage paths (for CongressionalPhotoServiceLocal)
    local_path TEXT,
    original_path TEXT,
    thumbnail_path TEXT,
    medium_path TEXT,
    large_path TEXT,
    
    -- Cloud storage paths (for CongressionalPhotoService)
    storage_path TEXT,
    storage_bucket TEXT DEFAULT 'congressional-photos',
    
    -- Photo metadata
    original_url TEXT NOT NULL,
    file_size INTEGER,
    image_width INTEGER,
    image_height INTEGER,
    content_hash TEXT,
    
    -- Processing status
    optimization_complete BOOLEAN DEFAULT FALSE,
    download_attempts INTEGER DEFAULT 0,
    last_error TEXT,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    downloaded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT unique_bioguide_congress UNIQUE(bioguide_id, congress_number),
    CONSTRAINT positive_dimensions CHECK (
        (image_width IS NULL OR image_width > 0) AND 
        (image_height IS NULL OR image_height > 0)
    ),
    CONSTRAINT positive_file_size CHECK (file_size IS NULL OR file_size > 0)
);

-- Enable RLS
ALTER TABLE public.congressional_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "congressional_photos_public_read" ON public.congressional_photos
    FOR SELECT USING (true);

CREATE POLICY "congressional_photos_admin_all" ON public.congressional_photos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Indexes for performance
CREATE INDEX idx_congressional_photos_bioguide ON public.congressional_photos(bioguide_id);
CREATE INDEX idx_congressional_photos_congress ON public.congressional_photos(congress_number);
CREATE INDEX idx_congressional_photos_member ON public.congressional_photos(member_id);
CREATE INDEX idx_congressional_photos_downloaded ON public.congressional_photos(downloaded_at DESC);
CREATE INDEX idx_congressional_photos_optimization ON public.congressional_photos(optimization_complete) WHERE optimization_complete = false;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_congressional_photos_updated_at
    BEFORE UPDATE ON public.congressional_photos
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Insert policy for service role
CREATE POLICY "congressional_photos_service_insert" ON public.congressional_photos
    FOR INSERT WITH CHECK (true);

-- Function to get photo URLs for a member
CREATE OR REPLACE FUNCTION public.get_member_photo_urls(
    p_bioguide_id TEXT,
    p_congress_number INTEGER DEFAULT NULL
)
RETURNS TABLE(
    thumbnail_url TEXT,
    medium_url TEXT,
    large_url TEXT,
    original_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN cp.local_path IS NOT NULL THEN cp.thumbnail_path
            WHEN cp.storage_path IS NOT NULL THEN 
                format('https://%s.supabase.co/storage/v1/object/public/%s/%s', 
                    split_part(current_setting('app.settings.supabase_url', true), '://', 2), 
                    cp.storage_bucket, 
                    cp.thumbnail_path)
            ELSE NULL
        END as thumbnail_url,
        CASE 
            WHEN cp.local_path IS NOT NULL THEN cp.medium_path
            WHEN cp.storage_path IS NOT NULL THEN 
                format('https://%s.supabase.co/storage/v1/object/public/%s/%s', 
                    split_part(current_setting('app.settings.supabase_url', true), '://', 2), 
                    cp.storage_bucket, 
                    cp.medium_path)
            ELSE NULL
        END as medium_url,
        CASE 
            WHEN cp.local_path IS NOT NULL THEN cp.large_path
            WHEN cp.storage_path IS NOT NULL THEN 
                format('https://%s.supabase.co/storage/v1/object/public/%s/%s', 
                    split_part(current_setting('app.settings.supabase_url', true), '://', 2), 
                    cp.storage_bucket, 
                    cp.large_path)
            ELSE NULL
        END as large_url,
        CASE 
            WHEN cp.local_path IS NOT NULL THEN cp.original_path
            WHEN cp.storage_path IS NOT NULL THEN 
                format('https://%s.supabase.co/storage/v1/object/public/%s/%s', 
                    split_part(current_setting('app.settings.supabase_url', true), '://', 2), 
                    cp.storage_bucket, 
                    cp.storage_path)
            ELSE NULL
        END as original_url
    FROM public.congressional_photos cp
    WHERE cp.bioguide_id = p_bioguide_id
    AND (p_congress_number IS NULL OR cp.congress_number = p_congress_number)
    ORDER BY cp.congress_number DESC, cp.downloaded_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON public.congressional_photos TO anon, authenticated;
GRANT ALL ON public.congressional_photos TO service_role;
GRANT EXECUTE ON FUNCTION public.get_member_photo_urls TO anon, authenticated, service_role;

COMMIT; 