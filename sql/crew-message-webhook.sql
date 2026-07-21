-- ═══════════════════════════════════════════════════════════════════════════
-- Crew push notifications: fire notify-crew-message on every crew message.
--
-- This is the SQL equivalent of a Supabase "Database Webhook" — a trigger that
-- POSTs the new row to the Netlify function. Use this instead of hunting for
-- the dashboard Webhooks page (which moves between Supabase versions).
--
-- BEFORE RUNNING: replace YOUR_WEBHOOK_SECRET below with the same value you set
-- for WEBHOOK_SECRET in Netlify (the one the concerts webhook already uses).
-- Run in Supabase → SQL Editor. Idempotent: safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════════

-- pg_net gives Postgres the ability to make HTTP calls. Supabase ships it;
-- this is a no-op if it's already enabled.
create extension if not exists pg_net;

create or replace function public.notify_crew_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url     := 'https://encorefriends.com/.netlify/functions/notify-crew-message',
    headers := jsonb_build_object(
      'Content-Type',    'application/json',
      'x-webhook-secret', 'YOUR_WEBHOOK_SECRET'   -- ← replace with your real WEBHOOK_SECRET before running (never commit the real value)
    ),
    body    := jsonb_build_object('record', row_to_json(NEW))
  );
  return NEW;
end;
$$;

drop trigger if exists notify_crew_message_trigger on public.thread_messages;
create trigger notify_crew_message_trigger
  after insert on public.thread_messages
  for each row execute function public.notify_crew_message();

-- Verify the trigger exists:
--   select tgname from pg_trigger where tgrelid = 'public.thread_messages'::regclass;
-- Expect: notify_crew_message_trigger
