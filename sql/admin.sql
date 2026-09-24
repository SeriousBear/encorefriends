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

-- ── guard: nobody can grant themselves admin ─────────────────────────────────
-- Normal users edit their own profile row via RLS. Without this, a user could
-- flip their own is_admin to true. This trigger blocks a change to is_admin that
-- comes from an API request (role 'authenticated'/'anon'). The Supabase SQL
-- editor (role 'postgres') and the service-role key are NOT blocked — that's how
-- you set who is admin. Created BEFORE the UPDATE below so re-runs stay clean.
-- NOTE: not SECURITY DEFINER, so current_user reflects the caller's role.
create or replace function public.block_is_admin_escalation()
returns trigger
language plpgsql
as $$
begin
  if new.is_admin is distinct from old.is_admin
     and current_user in ('authenticated', 'anon')
  then
    raise exception 'is_admin can only be changed by an administrator';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_block_is_admin on public.profiles;
create trigger trg_block_is_admin
  before update on public.profiles
  for each row execute function public.block_is_admin_escalation();

-- ── make exactly ONE account the super user (everyone else demoted) ──────────
-- Sets is_admin=true for the matching email and false for all others, so there
-- is only ever one super user. Run from the SQL editor (not blocked by the
-- trigger above). SAFETY: if the email doesn't match a real user, this does
-- NOTHING — a leftover placeholder can't lock you out of your own admin page.
do $$
declare admin_id uuid;
begin
  select id into admin_id
  from auth.users
  where lower(email) = lower('you@example.com');   -- <-- your real login email

  if admin_id is null then
    raise notice 'No user matches that email — skipping. Nothing changed.';
  else
    update public.profiles set is_admin = (id = admin_id);
  end if;
end $$;

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
