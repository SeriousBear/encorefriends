// netlify/functions/receive-email.mjs
//
// Receives forwarded ticket emails (and Gmail's forwarding-confirmation email),
// matches them to a user by their private forward token, and saves any concerts
// using the SAME parser as the manual scan. Saving triggers the notify-new-show
// webhook (followers pushed) and the client's realtime auto-popup.
//
// The Cloudflare Email Worker forwards the RAW MIME message; we parse it here
// with postal-mime so Claude only ever sees clean body text (no headers, no
// HTML, no attachments) — better parses, far fewer tokens. Form-data inbound
// providers (SendGrid/Mailgun) are still supported as a fallback.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, URL (Netlify sets this),
//      RECEIVE_SECRET (optional; if set, the ?key= query must match)

import { createClient } from "@supabase/supabase-js";
import PostalMime from "postal-mime";
import {
  PARSE_SYSTEM,
  tokenFromAddress,
  extractParseResult,
  buildConcertRow,
} from "./parse-helpers.mjs";

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const HOURLY_LIMIT = 40; // forwards processed per user per hour (abuse/cost cap)

// PARSE_SYSTEM and the other pure helpers live in parse-helpers.mjs so
// unit tests and evals exercise exactly what production runs.

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });

// Audit log for every forward — powers debugging, health checks, and the
// per-user rate limit. Best-effort: never let logging break processing.
async function logEvent(userId, subject, result, detail) {
  try {
    await sb.from("forward_events").insert({
      user_id: userId,
      subject: String(subject || "").slice(0, 200),
      result,
      detail: detail == null ? null : String(detail).slice(0, 300),
    });
  } catch (e) {
    /* ignore */
  }
}

export default async (req) => {
  // Optional shared secret in the query string.
  if (process.env.RECEIVE_SECRET) {
    const key = new URL(req.url).searchParams.get("key");
    if (key !== process.env.RECEIVE_SECRET)
      return new Response("forbidden", { status: 403 });
  }

  // Cloudflare worker posts { raw, to, from, envelope } as JSON; form-data
  // inbound providers post parsed fields. Support both.
  let raw = "",
    to = "",
    from = "",
    subject = "",
    text = "",
    html = "",
    envelope = "";
  const ctype = req.headers.get("content-type") || "";
  try {
    if (
      ctype.includes("form-data") ||
      ctype.includes("x-www-form-urlencoded")
    ) {
      const f = await req.formData();
      to = f.get("to") || "";
      from = f.get("from") || "";
      subject = f.get("subject") || "";
      text = f.get("text") || "";
      html = f.get("html") || "";
      envelope = f.get("envelope") || "";
    } else {
      const j = await req.json();
      raw = j.raw || "";
      to = j.to || "";
      from = j.from || "";
      subject = j.subject || "";
      text = j.text || "";
      html = j.html || "";
      envelope = j.envelope ? JSON.stringify(j.envelope) : "";
    }
  } catch (e) {
    return new Response("bad payload", { status: 400 });
  }

  // Parse the raw MIME properly: strips headers, decodes the body, drops HTML
  // and attachments — Claude sees only clean text.
  if (raw) {
    try {
      const email = await new PostalMime().parse(raw);
      subject = email.subject || subject;
      from = (email.from && email.from.address) || from;
      text =
        email.text ||
        (email.html ? email.html.replace(/<[^>]+>/g, " ") : "") ||
        text;
    } catch (e) {
      /* fall back to whatever fields we were given */
    }
  }
  const body = text || (html ? html.replace(/<[^>]+>/g, " ") : "");

  // Which private mailbox did this land in? Prefer the envelope recipient.
  let token = null;
  try {
    const env = envelope ? JSON.parse(envelope) : null;
    const envTo = env && (Array.isArray(env.to) ? env.to[0] : env.to);
    token = tokenFromAddress(envTo);
  } catch (e) {
    /* fall through */
  }
  if (!token) token = tokenFromAddress(to);
  if (!token) return json({ ok: false, reason: "no forward token in recipient" });

  const { data: prof } = await sb
    .from("profiles")
    .select("id")
    .eq("forward_token", token)
    .single();
  if (!prof) return json({ ok: false, reason: "unknown token" });
  const userId = prof.id;

  // ── Rate limit: cap forwards processed per user per hour. ──
  const since = new Date(Date.now() - 3600 * 1000).toISOString();
  const { count } = await sb
    .from("forward_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);
  if ((count || 0) >= HOURLY_LIMIT) {
    await logEvent(userId, subject, "rate_limited", null);
    return json({ ok: false, reason: "rate limited" });
  }

  // ── Gmail's forwarding-confirmation email ──
  // Gmail sends a confirmation LINK (no numeric code) that must be clicked in a
  // real browser. Store it so the app can show a one-tap "Finish verifying"
  // button. Some providers send a numeric code instead — capture that too.
  if (
    /forwarding-noreply@google\.com/i.test(from) ||
    /forwarding confirmation/i.test(subject)
  ) {
    const linkM = body.match(
      /https:\/\/mail(?:-settings)?\.google\.com\/[^\s"'<>]+/i,
    );
    const link = linkM ? linkM[0].replace(/[)\]>.,"']+$/, "") : null;
    const codeM =
      body.match(/confirmation code[\s\S]{0,80}?(\d{6,10})/i) ||
      subject.match(/#\s*(\d{6,10})/);
    const code = codeM ? codeM[1] : null;
    const upd = {};
    if (link) upd.forward_confirm_link = link;
    if (code) upd.forward_confirm_code = code;
    if (Object.keys(upd).length)
      await sb.from("profiles").update(upd).eq("id", userId);
    await logEvent(userId, subject, "confirm", link ? "link captured" : "no link");
    return json({ ok: true, kind: "gmail-confirm", link: !!link, code: !!code });
  }

  // ── A real forwarded email → forwarding is working. ──
  await sb.from("profiles").update({ forward_verified: true }).eq("id", userId);

  // Parse with the same model + prompt as the manual scan (now on clean text).
  let concerts = [];
  let isTicket = false;
  try {
    const ai = await fetch(
      (process.env.URL || "") + "/.netlify/functions/claude",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 4000,
          system: PARSE_SYSTEM,
          messages: [
            {
              role: "user",
              content: (subject ? "Subject: " + subject + "\n\n" : "") + body,
            },
          ],
        }),
      },
    );
    const d = await ai.json();
    const t = (d.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");
    const parsed = extractParseResult(t);
    isTicket = parsed.is_ticket;
    concerts = parsed.shows;
  } catch (e) {
    await logEvent(userId, subject, "error", "parse failed: " + e.message);
    return json({ ok: false, reason: "parse failed", error: String(e) });
  }

  let saved = 0;
  for (const c of concerts) {
    const row = buildConcertRow(c, userId);
    if (!row) continue;
    try {
      // Insert; the unique index on (owner_id, artist, date) makes dedup atomic.
      const { data } = await sb
        .from("concerts")
        .upsert(row, { onConflict: "owner_id,artist,date", ignoreDuplicates: true })
        .select();
      const row = data && data[0];
      if (row && row.id) {
        await sb
          .from("concert_attendees")
          .insert({ concert_id: row.id, user_id: userId });
        saved++;
      }
    } catch (e) {
      /* skip individual failures */
    }
  }

  // ── Feedback logic ──
  if (saved > 0) {
    await logEvent(userId, subject, "saved", saved + " show(s)");
  } else if (isTicket) {
    // Looked like a real music ticket but we couldn't extract it → worth a nudge.
    await logEvent(userId, subject, "no_show", "music ticket, 0 parsed");
    try {
      await sb.from("notifications").insert({
        user_id: userId,
        type: "forward_no_show",
        read: false,
        data: { subject: String(subject || "").slice(0, 120) },
      });
    } catch (e) {
      /* notifications schema may differ; ignore */
    }
  } else {
    // Not a music ticket at all (receipt, newsletter, non-music event) →
    // silently ignore. Logged for the admin view, but no user notification.
    await logEvent(userId, subject, "ignored", "not a music ticket");
  }

  return json({ ok: true, kind: "ticket", saved });
};
