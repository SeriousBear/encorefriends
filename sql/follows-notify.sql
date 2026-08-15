-- ============================================================================
-- Per-friend "notify me about their shows" preference, stored on the follow.
-- Run once in the Supabase SQL editor.
--
-- Default TRUE = you get a ping for everyone you follow (the app's promise);
-- the bell next to each friend lets you mute individuals. The app + the
-- notify-new-show function tolerate this column being absent, so running this
-- is what turns the per-friend bell into a real, cross-device filter.
-- ============================================================================

alter table public.follows
  add column if not exists notify boolean not null default true;

-- (optional) sanity check
-- select follower_id, following_id, notify from public.follows limit 20;
