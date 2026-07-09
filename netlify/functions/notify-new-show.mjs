// netlify/functions/notify-new-show.mjs
//
// Fired by a Supabase Database Webhook on INSERT into `concerts`.
// Looks up everyone who follows the show's owner, grabs their saved push
// subscriptions, and sends each one a web-push notification. Also drops an
// in-app notification row per follower so a future bell can show them.
//
// Netlify env vars to set:
//   VAPID_PUBLIC_KEY            (same key that's pasted into app.js)
//   VAPID_PRIVATE_KEY           (the private half — keep secret)
//   VAPID_SUBJECT              (e.g. mailto:you@encorefriends.com)
//   SUPABASE_URL               (https://zfcehcqklrrfncihjwkk.supabase.co)
//   SUPABASE_SERVICE_ROLE_KEY  (Supabase → Settings → API → service_role; secret)
//   WEBHOOK_SECRET             (any random string; also set as a webhook header)

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
  // Only the Supabase webhook (which sends our secret header) may call this.
  if (req.headers.get("x-webhook-secret") !== process.env.WEBHOOK_SECRET)
    return new Response("forbidden", { status: 403 });

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response("bad request", { status: 400 });
  }

  // Supabase webhooks put the new row in `record`.
  const row = body.record || body;
  const ownerId = row.owner_id;
  if (!ownerId) return ok({ skipped: "no owner_id" });

  // Owner's display name for the message.
  const { data: owner } = await sb
    .from("profiles")
    .select("name, handle")
    .eq("id", ownerId)
    .single();
  const ownerName = (owner && (owner.name || owner.handle)) || "Someone";

  // Followers of the owner.
  const { data: followers } = await sb
    .from("follows")
    .select("follower_id")
    .eq("following_id", ownerId);
  const followerIds = (followers || []).map((f) => f.follower_id);
  if (!followerIds.length) return ok({ sent: 0, reason: "no followers" });

  // In-app notification rows (best-effort — never block the push send).
  try {
    await sb.from("notifications").insert(
      followerIds.map((uid) => ({
        user_id: uid,
        type: "new_show",
        read: false,
        data: { actor: ownerName, artist: row.artist || "" },
      })),
    );
  } catch (e) {
    /* notifications table shape may differ; ignore */
  }

  // Their push subscriptions.
  const { data: subs } = await sb
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .in("user_id", followerIds);
  if (!subs || !subs.length) return ok({ sent: 0, reason: "no subscriptions" });

  const dateStr = row.date
    ? new Date(row.date + "T12:00:00").toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : "";
  const payload = JSON.stringify({
    title: ownerName + " added a show",
    body:
      (row.artist || "A show") +
      (row.city ? " · " + row.city : "") +
      (dateStr ? " · " + dateStr : ""),
    url: "/app.html",
    tag: "show-" + (row.id || Date.now()),
  });

  const results = await Promise.allSettled(
    subs.map((s) =>
      webpush
        .sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        )
        .catch(async (err) => {
          // 404 / 410 = the subscription is dead; prune it.
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

  const sent = results.filter((r) => r.status === "fulfilled").length;
  return ok({ sent, total: subs.length, followers: followerIds.length });
};
