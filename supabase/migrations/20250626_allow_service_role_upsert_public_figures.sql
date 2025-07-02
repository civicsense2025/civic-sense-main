-- -----------------------------------------------------------------------------
-- 2025-06-26  —  Allow backend upserts into public_figures & back-fill defaults
-- -----------------------------------------------------------------------------
-- 1️⃣  Make sure RLS is ON (good practice) …
alter table public_figures enable row level security;

-- 2️⃣  … but let the Postgres role behind the SUPABASE_SERVICE_ROLE_KEY bypass it.
--     This key is only used by trusted server-side jobs (e.g. the sync service).
create policy if not exists "service_role_manage_public_figures"
  on public_figures
  for all                     -- SELECT, INSERT, UPDATE, DELETE
  to service_role             -- ← internal Postgres role used by the service key
  using (true)                -- allow the operation
  with check (true);          -- and allow the new/updated row

-- 3️⃣  Back-fill default values so existing rows have something sane in the
--     new congressional columns (avoids NOT NULL / check-constraint surprises).
update public_figures
set
  is_politician           = coalesce(is_politician, false),
  congress_member_type    = coalesce(congress_member_type, 'unknown'),
  current_positions       = coalesce(current_positions, '{}'::text[]),
  office                  = coalesce(office, 'Unknown'),
  congress_api_last_sync  = coalesce(congress_api_last_sync, now())
where true;

-- 4️⃣  (Optional) If you ever want to let normal authenticated users read these
--     extra columns, add a separate SELECT policy here instead of opening
--     everything up above.
-- ----------------------------------------------------------------------------- 