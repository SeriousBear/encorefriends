// netlify/functions/notify-new-show.mjs
//
// Fired by a Supabase Database Webhook on INSERT into `concerts`.
//
// 1. FOLLOWERS — everyone following the show's owner gets an in-app
//    notification row + a web push. (Unchanged behavior.)
// 2. DISCOVERY (Phase 4) — if the owner is Open to Connect, other Open to
//    Connect users whose genres overlap the show's genres get a "taste match"
//    notification. Hard-capped at ONE discovery notification per user per
//    24h, max 50 recipients per show, so it never becomes spam.
//
// Netlify env vars (unchanged from before):
//   VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / WEBHOOK_SECRET

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

// Send one payload to a list of user ids; prunes dead subscriptions.
async function pushTo(userIds, payload) {
  if (!userIds.length) return 0;
  const { data: subs } = await sb
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .in("user_id", userIds);
  if (!subs || !subs.length) return 0;
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
  return results.filter((r) => r.status === "fulfilled").length;
}

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

  const row = body.record || body;
  const ownerId = row.owner_id;
  if (!ownerId) return ok({ skipped: "no owner_id" });
  // Quiet shows never notify anyone.
  if (row.hidden) return ok({ skipped: "hidden" });

  const { data: owner } = await sb
    .from("profiles")
    .select("name, handle, discoverable")
    .eq("id", ownerId)
    .single();
  const ownerName = (owner && (owner.name || owner.handle)) || "Someone";

  const dateStr = row.date
    ? new Date(row.date + "T12:00:00").toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : "";

  // ── 1. Followers ──────────────────────────────────────────────────────────
  const { data: followers } = await sb
    .from("follows")
    .select("follower_id")
    .eq("following_id", ownerId);
  const followerIds = (followers || []).map((f) => f.follower_id);

  let sent = 0;
  if (followerIds.length) {
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

    sent = await pushTo(
      followerIds,
      JSON.stringify({
        title: ownerName + " added a show",
        body:
          (row.artist || "A show") +
          (row.city ? " · " + row.city : "") +
          (dateStr ? " · " + dateStr : ""),
        url: "/app.html",
        tag: "show-" + (row.id || Date.now()),
      }),
    );
  }

  // ── 2. Discovery: taste matches, capped ───────────────────────────────────
  let discovery = 0;
  try {
    const genres = Array.isArray(row.genres) ? row.genres : [];
    if (genres.length && owner && owner.discoverable) {
      // Open to Connect users who share at least one genre with this show.
      const { data: matches } = await sb
        .from("profiles")
        .select("id")
        .eq("discoverable", true)
        .neq("id", ownerId)
        .overlaps("genres", genres)
        .limit(50);
      let ids = (matches || [])
        .map((m) => m.id)
        .filter((id) => !followerIds.includes(id)); // followers already pinged

      // Cap: at most one taste_match per user per 24h.
      if (ids.length) {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: recent } = await sb
          .from("notifications")
          .select("user_id")
          .eq("type", "taste_match")
          .gte("created_at", since)
          .in("user_id", ids);
        const capped = new Set((recent || []).map((r) => r.user_id));
        ids = ids.filter((id) => !capped.has(id));
      }

      if (ids.length) {
        await sb.from("notifications").insert(
          ids.map((uid) => ({
            user_id: uid,
            type: "taste_match",
            read: false,
            data: {
              actor: ownerName,
              artist: row.artist || "",
              genres: genres.slice(0, 3),
            },
          })),
        );
        discovery = await pushTo(
          ids,
          JSON.stringify({
            title: "Your kind of show ⚡",
            body:
              (row.artist || "A show") +
              (genres[0] ? " · " + genres[0] : "") +
              (row.city ? " · " + row.city : "") +
              (dateStr ? " · " + dateStr : ""),
            url: "/app.html",
            tag: "taste-" + (row.id || Date.now()),
          }),
        );
        // Count in-app rows even when a user has no push subscription.
        discovery = discovery || ids.length;
      }
    }
  } catch (e) {
    /* discovery is best-effort — never break follower notifications */
  }

  return ok({ sent, followers: followerIds.length, discovery });
};
