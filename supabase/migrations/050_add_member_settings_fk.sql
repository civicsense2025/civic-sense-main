-- Add composite foreign key between member_individual_settings and pod_memberships
-- Ensures PostgREST can generate nested relationships used in /api/learning-pods/{podId}
-- Idempotent: only adds if the constraint does not yet exist

BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'member_settings_membership_fkey'
    ) THEN
        ALTER TABLE IF EXISTS member_individual_settings
        ADD CONSTRAINT member_settings_membership_fkey
        FOREIGN KEY (pod_id, user_id)
        REFERENCES pod_memberships(pod_id, user_id)
        ON DELETE CASCADE;
    END IF;
END $$;

COMMIT; 