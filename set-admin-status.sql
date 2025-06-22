-- Set admin status for user account
-- Run this in your Supabase SQL editor or database admin tool

-- First, ensure the user has a profile record
INSERT INTO "public"."profiles" ("id", "is_admin", "updated_at") 
VALUES (
  '333c0b18-2120-4050-9c4b-708a26726859', 
  true,
  NOW()
) 
ON CONFLICT ("id") 
DO UPDATE SET 
  "is_admin" = true,
  "updated_at" = NOW();

-- Verify the admin status was set
SELECT 
  id,
  full_name,
  is_admin,
  updated_at
FROM "public"."profiles" 
WHERE "id" = '333c0b18-2120-4050-9c4b-708a26726859';

-- Optional: Also set up in user_roles table if it exists
INSERT INTO "public"."user_roles" ("user_id", "role", "permissions", "granted_at") 
VALUES (
  '333c0b18-2120-4050-9c4b-708a26726859', 
  'admin', 
  '["all", "user_management", "content_management", "system_admin", "analytics_admin"]'::jsonb,
  NOW()
) 
ON CONFLICT ("user_id", "role") 
DO UPDATE SET
  "permissions" = EXCLUDED."permissions",
  "updated_at" = NOW(); 