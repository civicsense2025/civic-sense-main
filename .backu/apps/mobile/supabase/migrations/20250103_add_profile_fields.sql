-- Migration: Add enhanced profile fields for civic personalization
-- Created: 2025-01-03
-- Description: Add bio, location, and geographic fields for personalized civic content

BEGIN;

-- ============================================
-- ADD PROFILE FIELDS
-- ============================================

-- Add bio field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add location field to profiles table  
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS location TEXT;

-- Add country field for civic personalization
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS country TEXT;

-- Add state/province field for regional civic content
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS state_province TEXT;

-- Add city field for local civic engagement
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS city TEXT;

-- ============================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN public.profiles.bio IS 'User biography/about section - up to 500 characters';
COMMENT ON COLUMN public.profiles.location IS 'User location - general location string';
COMMENT ON COLUMN public.profiles.country IS 'User country - ISO country code or name for civic personalization';
COMMENT ON COLUMN public.profiles.state_province IS 'User state/province for regional civic content';
COMMENT ON COLUMN public.profiles.city IS 'User city for local civic engagement opportunities';

-- ============================================
-- ADD CONSTRAINTS (PostgreSQL compatible)
-- ============================================

-- Check if constraints already exist before adding
DO $$ 
BEGIN
    -- Bio length constraint (max 500 characters)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_bio_length' 
        AND table_name = 'profiles'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_bio_length 
        CHECK (char_length(bio) <= 500);
    END IF;

    -- Location length constraint (max 100 characters)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_location_length' 
        AND table_name = 'profiles'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_location_length 
        CHECK (char_length(location) <= 100);
    END IF;

    -- Country length constraint (max 50 characters)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_country_length' 
        AND table_name = 'profiles'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_country_length 
        CHECK (char_length(country) <= 50);
    END IF;

    -- State/province length constraint (max 50 characters)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_state_province_length' 
        AND table_name = 'profiles'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_state_province_length 
        CHECK (char_length(state_province) <= 50);
    END IF;

    -- City length constraint (max 50 characters)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_city_length' 
        AND table_name = 'profiles'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_city_length 
        CHECK (char_length(city) <= 50);
    END IF;
END $$;

-- ============================================
-- ADD INDEXES FOR PERFORMANCE
-- ============================================

-- Index for bio text search (partial index for non-null values)
CREATE INDEX IF NOT EXISTS idx_profiles_bio_search 
ON public.profiles USING gin(to_tsvector('english', bio)) 
WHERE bio IS NOT NULL;

-- Index for location filtering
CREATE INDEX IF NOT EXISTS idx_profiles_location 
ON public.profiles(location) 
WHERE location IS NOT NULL;

-- Index for country-based civic content
CREATE INDEX IF NOT EXISTS idx_profiles_country 
ON public.profiles(country) 
WHERE country IS NOT NULL;

-- Index for state/province-based civic content  
CREATE INDEX IF NOT EXISTS idx_profiles_state_province 
ON public.profiles(state_province) 
WHERE state_province IS NOT NULL;

-- Index for city-based local civic engagement
CREATE INDEX IF NOT EXISTS idx_profiles_city 
ON public.profiles(city) 
WHERE city IS NOT NULL;

-- Composite index for regional civic content personalization
CREATE INDEX IF NOT EXISTS idx_profiles_location_composite 
ON public.profiles(country, state_province, city) 
WHERE country IS NOT NULL OR state_province IS NOT NULL OR city IS NOT NULL;

-- ============================================
-- UPDATE RLS POLICIES (SAFELY)
-- ============================================

-- Update existing RLS policies to include new fields
-- Users can view profiles (including new location fields)
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
CREATE POLICY "Users can view profiles" 
ON public.profiles FOR SELECT 
USING (true);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- Users can insert their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify all columns were added
DO $$
BEGIN
    -- Check if bio column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'bio'
    ) THEN
        RAISE EXCEPTION 'Bio column was not created successfully';
    END IF;
    
    -- Check if location column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'location'
    ) THEN
        RAISE EXCEPTION 'Location column was not created successfully';
    END IF;
    
    -- Check if country column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'country'
    ) THEN
        RAISE EXCEPTION 'Country column was not created successfully';
    END IF;
    
    -- Check if state_province column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'state_province'
    ) THEN
        RAISE EXCEPTION 'State/province column was not created successfully';
    END IF;
    
    -- Check if city column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'city'
    ) THEN
        RAISE EXCEPTION 'City column was not created successfully';
    END IF;
    
    RAISE NOTICE 'Migration completed successfully - all profile fields added';
END
$$;

COMMIT;

-- ============================================
-- MANUAL REMINDERS
-- ============================================

-- Note: After running this migration, update:
-- 1. lib/supabase.ts - Update DbProfile interface
-- 2. lib/auth-context.tsx - Update DbProfile interface  
-- 3. app/settings/edit-profile.tsx - Add new fields to form
-- 4. Consider adding country/state lookup tables for validation 