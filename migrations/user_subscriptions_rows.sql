-- Update subscription to Pro tier with lifetime access
UPDATE "public"."user_subscriptions" 
SET 
  "subscription_tier" = 'pro',
  "subscription_status" = 'active',
  "subscription_start_date" = '2025-01-14 00:00:00+00',
  "subscription_end_date" = '2099-12-31 23:59:59+00', -- Lifetime access
  "billing_cycle" = 'lifetime',
  "amount_cents" = 5000, -- $50 lifetime
  "updated_at" = NOW()
WHERE "user_id" = '333c0b18-2120-4050-9c4b-708a26726859';

-- Create admin roles table (run this if it doesn't exist)
CREATE TABLE IF NOT EXISTS "public"."user_roles" (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "user_id" UUID NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
  "role" TEXT NOT NULL CHECK (role IN ('user', 'admin', 'super_admin')),
  "permissions" JSONB DEFAULT '[]'::jsonb,
  "granted_by" UUID REFERENCES "public"."profiles"("id"),
  "granted_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Grant super admin role
INSERT INTO "public"."user_roles" ("user_id", "role", "permissions", "granted_at") 
VALUES (
  '333c0b18-2120-4050-9c4b-708a26726859', 
  'super_admin', 
  '["all", "user_management", "content_management", "system_admin", "analytics_admin", "billing_admin"]'::jsonb,
  NOW()
) ON CONFLICT (user_id, role) DO UPDATE SET
  permissions = EXCLUDED.permissions,
  updated_at = NOW(); 