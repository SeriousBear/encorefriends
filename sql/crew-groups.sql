-- ═══════════════════════════════════════════════════════════════════════════
-- Crew groups: private, hand-picked group chats with invite/accept.
-- Run in Supabase → SQL Editor. Idempotent. Requires Phase 3 + Phase 7 SQL.
--
-- Changes the crew model from "open room, one per show, anyone going joins"
-- to "private group: creator hand-picks followers, they accept an invite."
-- Existing crews keep working — their members are treated as already 'joined'.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1 ▸ threads: custom name + allow multiple groups per show
alter table threads add column if not exists name text;
-- the old "one crew per (artist,date)" rule no longer applies to private groups
alter table threads drop constraint if exists threads_show_artist_show_date_key;
-- a group started from the Messages "+" isn't tied to a show, so show is optional
alter table threads alter column show_artist drop not null;
alter table threads alter column show_date drop not null;

-- 2 ▸ thread_members: invite status + who invited
alter table thread_members
  add column if not exists status text not null default 'joined'
    check (status in ('invited', 'joined'));
alter table thread_members
  add column if not exists invited_by uuid references profiles(id) on delete set null;

-- 3 ▸ Helpers (SECURITY DEFINER, explicit search_path)

-- Does the current user follow this person? (directional)
create or replace function public.is_following(target uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from follows f
    where f.follower_id = auth.uid() and f.following_id = target
  );
$$;

-- Is the current user a JOINED member of this thread (not just invited)?
create or replace function public.is_joined_member(tid uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from thread_members tm
    where tm.thread_id = tid and tm.user_id = auth.uid()
      and tm.status = 'joined'
  );
$$;

-- is_thread_member(tid) already exists (any status) from Phase 7 — reused for
-- visibility so invited users can see the group they were invited to.

-- 4 ▸ RLS — threads
drop policy if exists threads_select_visible on threads;
create policy threads_select_visible on threads
  for select using (is_thread_member(id));

drop policy if exists threads_insert_attendee on threads;
drop policy if exists threads_insert_creator on threads;
create policy threads_insert_creator on threads
  for insert with check (created_by = auth.uid());

-- Let a joined member rename the group.
drop policy if exists threads_update_member on threads;
create policy threads_update_member on threads
  for update using (is_joined_member(id))
  with check (is_joined_member(id));

-- 5 ▸ RLS — thread_members
drop policy if exists thread_members_select_visible on thread_members;
create policy thread_members_select_visible on thread_members
  for select using (
    user_id = auth.uid() or is_thread_member(thread_id)
  );

-- Insert: your own membership (self, e.g. creator seeding the group), OR a
-- joined member inviting someone they follow (status must be 'invited').
drop policy if exists thread_members_insert_self on thread_members;
drop policy if exists thread_members_insert on thread_members;
create policy thread_members_insert on thread_members
  for insert with check (
    (user_id = auth.uid())
    or (
      is_joined_member(thread_id)
      and status = 'invited'
      and is_following(user_id)
    )
  );

-- Update: only your own row (accept an invite → status 'joined'; last_read_at).
drop policy if exists thread_members_update_self on thread_members;
create policy thread_members_update_self on thread_members
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Delete: only your own row (decline invite / leave group).
drop policy if exists thread_members_delete_self on thread_members;
create policy thread_members_delete_self on thread_members
  for delete using (user_id = auth.uid());

-- 6 ▸ RLS — thread_messages: JOINED members only (invited can't read/send yet)
drop policy if exists thread_messages_select_members on thread_messages;
create policy thread_messages_select_members on thread_messages
  for select using (is_joined_member(thread_id));

drop policy if exists thread_messages_insert_members on thread_messages;
create policy thread_messages_insert_members on thread_messages
  for insert with check (
    sender_id = auth.uid() and is_joined_member(thread_id)
  );

-- 7 ▸ Verify:
--   select tablename, policyname, cmd from pg_policies
--   where tablename like 'thread%' order by 1, 3;
-- threads: select/insert/update · thread_members: select/insert/update/delete
-- · thread_messages: select/insert
