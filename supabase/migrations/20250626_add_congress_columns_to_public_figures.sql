-- Add missing congressional-specific columns to public_figures
-- Run with: supabase db push / supabase migrate deploy

alter table public_figures
  add column if not exists is_politician boolean default false,
  add column if not exists congress_member_type text,           -- 'representative' | 'senator' | etc.
  add column if not exists current_state text,                  -- Two-letter postal code (e.g., 'CA')
  add column if not exists current_district integer,            -- House district, null for senators
  add column if not exists office text,                         -- Current office title / chamber
  add column if not exists current_positions text[],            -- Array of human-readable strings
  add column if not exists party_affiliation text,              -- Full party name as returned by Congress.gov
  add column if not exists congressional_tenure_start date,
  add column if not exists congressional_tenure_end date,
  add column if not exists region text,                         -- Convenience field for filtering (usually state)
  add column if not exists congress_api_last_sync timestamptz,  -- When this record was last synced from Congress.gov
  add column if not exists slug text unique;

-- Refresh PostgREST cache (required for new columns to be visible immediately)
-- This no-op comment can be removed if you have a dedicated "rpc_refresh" call elsewhere. 