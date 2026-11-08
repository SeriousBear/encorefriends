-- sql/page-check.sql
-- Stores the result of the daily event-page re-check for each show.
-- Run once in the Supabase SQL editor. Safe to re-run.
--
-- Shape of the JSON:
--   { "checked_at": "2026-11-08T15:00:00Z",
--     "diff": [ { "field": "date", "was": "2026-11-08", "now": "2026-11-07" } ],
--     "page": { "date": "...", "city": "...", "venue": "...", "title": "..." } }
-- diff == [] means the page still matches. The UI badges a show only when diff
-- is non-empty. Written by the service role (event-recheck.mjs); cleared to null
-- by the owner when they apply or dismiss the change.

alter table public.concerts
  add column if not exists page_check jsonb;
