-- Create Supabase Storage Bucket for Congressional Photos
-- Migration: 20241222000011_create_storage_bucket.sql

BEGIN;

-- Create the congressional-photos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'congressional-photos',
    'congressional-photos', 
    true,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg'];

-- Allow public read access to congressional photos
CREATE POLICY "congressional_photos_public_read" ON storage.objects
    FOR SELECT USING (bucket_id = 'congressional-photos');

-- Allow service role to manage photos
CREATE POLICY "congressional_photos_service_manage" ON storage.objects
    FOR ALL USING (
        bucket_id = 'congressional-photos' AND
        auth.role() = 'service_role'
    );

-- Allow admins to manage photos
CREATE POLICY "congressional_photos_admin_manage" ON storage.objects
    FOR ALL USING (
        bucket_id = 'congressional-photos' AND
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

COMMIT; 