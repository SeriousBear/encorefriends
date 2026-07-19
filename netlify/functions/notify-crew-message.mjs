// netlify/functions/notify-crew-message.mjs
//
// Fired by a Supabase Database Webhook on INSERT into `thread_messages`.
// Pushes "{sender}: {message}" to every crew member except the sender.
//
// Anti-spam: the push `tag` is the crew id, so browsers COLLAPSE multiple
// pushes from the same crew into one notification instead of stacking them.
// No in-app notification rows — chat noise doesn't belong in Activity.
//
// SETUP (one-time, in Supabase → Database → Webhooks → Create):
//   Table: thread_messages · Events: INSERT
//   URL:   https://encorefriends.com/.netlify/functions/notify-crew-message
//   Headers: x-webhook-secret = <same WEBHOOK_SECRET as notify-new-show>
//
// Env (all already set for notify-new-show): VAPID_*, SUPABASE_URL,
// SUPABASE_SERVICE_ROLE_KEY, WEBHOOK_SECRET

import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:hello@encorefriends.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

const ok = (obj) => Response.json(obj);

export default async (req) => {
  if (req.headers.get("x-webhook-secret") !== process.env.WEBHOOK_SECRET)
    return new Response("forbidden", { status: 403 });

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response("bad request", { status: 400 });
  }

  const row = body.record || body;
  if (!row.thread_id || !row.sender_id) return ok({ skipped: "bad row" });

  const [{ data: thread }, { data: members }, { data: sender }] =
    await Promise.all([
      sb
        .from("threads")
        .select("show_artist")
        .eq("id", row.thread_id)
        .single(),
      sb
        .from("thread_members")
        .select("user_id")
        .eq("thread_id", row.thread_id)
        .neq("user_id", row.sender_id),
      sb
        .from("profiles")
        .select("name, handle")
        .eq("id", row.sender_id)
        .single(),
    ]);

  const ids = (members || []).map((m) => m.user_id);
  if (!ids.length) return ok({ sent: 0, reason: "no other members" });

  const senderName = (sender && (sender.name || sender.handle)) || "Someone";
  const payload = JSON.stringify({
    title: "👥 " + ((thread && thread.show_artist) || "Crew") + " crew",
    body: senderName + ": " + String(row.body || "").slice(0, 90),
    url: "/app.html",
    tag: "crew-" + row.thread_id, // collapses per-crew instead of stacking
  });

  const { data: subs } = await sb
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .in("user_id", ids);
  if (!subs || !subs.length) return ok({ sent: 0, reason: "no subscriptions" });

  const results = await Promise.allSettled(
    subs.map((s) =>
      webpush
        .sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        )
        .catch(async (err) => {
          if (err.statusCode === 404 || err.statusCode === 410) {
            await sb
              .from("push_subscriptions")
              .delete()
              .eq("endpoint", s.endpoint);
          }
          throw err;
        }),
    ),
  );

  return ok({
    sent: results.filter((r) => r.status === "fulfilled").length,
    members: ids.length,
  });
};
