-- sql/admin.sql
-- Super-user (admin) setup + the RLS an admin needs to fix others' ticket links.
-- Run this once in the Supabase SQL editor. Safe to re-run (idempotent).
--
-- STEP 1 — replace the placeholder below with YOUR login email, then run the
-- whole file. Do not commit your real email into the repo if it's public;
-- swap it in the Supabase editor at run time and leave the placeholder here.

-- ── is_admin column ──────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- ── make exactly ONE account the super user (everyone else demoted) ──────────
-- This sets is_admin=true for the matching email and false for all others, so
-- there is only ever one super user.
update public.profiles p
set is_admin = (p.id = (
  select id from auth.users where lower(email) = lower('you@example.com')
));

-- ── guard: nobody can grant themselves admin ─────────────────────────────────
-- Normal users edit their own profile row via RLS. Without this, a user could
-- flip their own is_admin to true. This trigger blocks any change to is_admin
-- that doesn't come from the service role (server-side) key. To change who is
-- admin later, re-run the UPDATE above from the SQL editor (service role).
create or replace function public.block_is_admin_escalation()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.is_admin is distinct from old.is_admin
     and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role'
  then
    raise exception 'is_admin can only be changed by the service role';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_block_is_admin on public.profiles;
create trigger trg_block_is_admin
  before update on public.profiles
  for each row execute function public.block_is_admin_escalation();

-- ── RLS: let admins update ANY concert (so the dashboard can fix links) ──────
-- Owners already update their own rows via existing policy; this adds admins on
-- top. Uses a SECURITY DEFINER helper so the policy doesn't recurse on profiles.
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
stable
as $$
  select coalesce((select is_admin from public.profiles where id = uid), false);
$$;

drop policy if exists "admins update any concert" on public.concerts;
create policy "admins update any concert"
  on public.concerts
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
