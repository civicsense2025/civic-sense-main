-- Migration: Add custom pod type support and fun customization features
-- Description: Adds custom_type_label column and emoji/personalization features to learning_pods table

-- Add custom_type_label column to learning_pods table
ALTER TABLE learning_pods 
ADD COLUMN IF NOT EXISTS custom_type_label TEXT;

-- Add fun customization columns
ALTER TABLE learning_pods 
ADD COLUMN IF NOT EXISTS pod_emoji TEXT DEFAULT '👥',
ADD COLUMN IF NOT EXISTS pod_color TEXT DEFAULT '#3b82f6',
ADD COLUMN IF NOT EXISTS pod_slug TEXT,
ADD COLUMN IF NOT EXISTS pod_motto TEXT,
ADD COLUMN IF NOT EXISTS banner_image_url TEXT;

-- Add comment to document the new columns
COMMENT ON COLUMN learning_pods.custom_type_label IS 'Custom label for pods with pod_type = ''custom''';
COMMENT ON COLUMN learning_pods.pod_emoji IS 'Emoji/icon for the pod (defaults to 👥)';
COMMENT ON COLUMN learning_pods.pod_color IS 'Hex color code for pod theme (defaults to blue #3b82f6)';
COMMENT ON COLUMN learning_pods.pod_slug IS 'Custom URL-friendly slug for the pod (optional)';
COMMENT ON COLUMN learning_pods.pod_motto IS 'Custom motto or tagline for the pod';
COMMENT ON COLUMN learning_pods.banner_image_url IS 'URL for custom banner/cover image';

-- Update the pod_type to include 'custom' - handle both VARCHAR and enum cases
DO $$ 
BEGIN
    -- First, check if pod_type is an enum type
    IF EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'pod_type' AND typtype = 'e'
    ) THEN
        -- It's an enum, check if 'custom' value already exists
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'custom' 
            AND enumtypid = (
                SELECT oid FROM pg_type WHERE typname = 'pod_type'
            )
        ) THEN
            -- Add 'custom' to the pod_type enum
            ALTER TYPE pod_type ADD VALUE 'custom';
        END IF;
    ELSE
        -- It's likely a VARCHAR with CHECK constraint, update the constraint
        -- Drop the existing check constraint if it exists
        ALTER TABLE learning_pods 
        DROP CONSTRAINT IF EXISTS learning_pods_pod_type_check;
        
        -- Add new check constraint that includes 'custom'
        ALTER TABLE learning_pods 
        ADD CONSTRAINT learning_pods_pod_type_check 
        CHECK (pod_type IN (
            'family', 'friends', 'classroom', 'study_group', 
            'campaign', 'organization', 'book_club', 'debate_team', 
            'custom', 'district_program', 'school_program'
        ));
    END IF;
END $$;

-- Add unique constraint on pod_slug if not null
ALTER TABLE learning_pods 
ADD CONSTRAINT unique_pod_slug 
UNIQUE (pod_slug);

-- Add check constraint for valid hex colors
ALTER TABLE learning_pods 
ADD CONSTRAINT valid_pod_color 
CHECK (pod_color ~ '^#[0-9A-Fa-f]{6}$');

-- Add check constraint for reasonable slug format (alphanumeric + hyphens)
ALTER TABLE learning_pods 
ADD CONSTRAINT valid_pod_slug 
CHECK (pod_slug IS NULL OR pod_slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$');

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_learning_pods_custom_type_label 
ON learning_pods(custom_type_label) 
WHERE custom_type_label IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_learning_pods_pod_slug 
ON learning_pods(pod_slug) 
WHERE pod_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_learning_pods_pod_emoji 
ON learning_pods(pod_emoji);

-- Function to generate a slug from pod name if none provided
CREATE OR REPLACE FUNCTION generate_pod_slug(pod_name TEXT, pod_id UUID DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 1;
BEGIN
    -- Convert to lowercase, replace spaces and special chars with hyphens
    base_slug := lower(trim(regexp_replace(pod_name, '[^a-zA-Z0-9\s]', '', 'g')));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    base_slug := trim(base_slug, '-');
    
    -- Ensure it starts and ends with alphanumeric
    base_slug := regexp_replace(base_slug, '^[^a-z0-9]+|[^a-z0-9]+$', '', 'g');
    
    -- If empty after cleaning, use generic slug
    IF base_slug = '' THEN
        base_slug := 'pod';
    END IF;
    
    -- Limit length
    base_slug := left(base_slug, 50);
    
    final_slug := base_slug;
    
    -- Check for uniqueness (excluding current pod if pod_id provided)
    WHILE EXISTS (
        SELECT 1 FROM learning_pods 
        WHERE pod_slug = final_slug 
        AND (pod_id IS NULL OR id != pod_id)
    ) LOOP
        final_slug := base_slug || '-' || counter;
        counter := counter + 1;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql; 