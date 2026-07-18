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
import { GENRE_PROMPT_LIST, canonicalizeGenres } from "./genre-taxonomy.mjs";

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const FORWARD_DOMAIN = "encorefriends.com";
const HOURLY_LIMIT = 40; // forwards processed per user per hour (abuse/cost cap)

// Same extraction contract as the in-app scan (js/app.js doScan).
const PARSE_SYSTEM = `You are an expert MUSIC concert ticket email parser. Your job is to extract ONLY confirmed ticket PURCHASES for MUSIC events.

STRICT RULES — EXTRACT ONLY EMAILS THAT MATCH ALL OF THESE:

1. CONFIRMED PURCHASES ONLY — the user must have actually bought a ticket. Look for phrases like:
   "Your order", "Your tickets", "You're going", "Order confirmation", "Payment received", "Booking confirmation", "Order #", "Payment plan", "Installment payment"
   DO NOT INCLUDE: newsletters, "On sale now", "Tickets available", "Just announced", advertisements, presale invites, refund/cancel notices, waitlist emails.

2. MUSIC EVENTS ONLY:
   Concerts, DJ sets, festivals, club nights, raves, after-parties, music tours.
   DO NOT INCLUDE: comedy, sports, theater, conferences, podcasts, talks, museums, movies, food events.

3. MULTI-DAY FESTIVALS — return BOTH start_date and end_date. For single-day events, end_date equals start_date.

4. DEDUPLICATION — if multiple emails reference the same event/order, include the EVENT only ONCE.

Return ONLY a valid JSON object of this exact shape:
{"is_ticket": boolean, "shows": [ ... ]}

- is_ticket: true if this email is a confirmed order/ticket for a live MUSIC event (concert, festival, DJ set, club night, tour) — even if you could not extract clean details. false for EVERYTHING else: retail orders, food/travel receipts, newsletters, promos, on-sale announcements, and non-music events (sports, comedy, theater).
- shows: an array of the qualifying music purchases. Each show object:
{"artist": string, "venue": string, "city": string, "date": "YYYY-MM-DD", "end_date": "YYYY-MM-DD", "source": string, "ticket_url": string, "is_festival": boolean, "genres": string[]}

- artist: performer/band/DJ name. For festivals, use the festival name.
- venue: the venue name from the email. If shown as "TBA"/missing, scan the body for an explicit address or "LOCATION:" line and use that.
- city: "City, State" — taken ONLY from a location/address/city explicitly written in this email. If only an address is given, use its city/state. NEVER guess the city. If none is stated, use "".
- date: start date — REQUIRED for a show to appear in "shows".
- end_date: end date — equals date for single-day shows.
- source: ticketing platform (Ticketmaster, SeatGeek, RA, DICE, See Tickets, etc.).
- ticket_url: the direct link for THIS show copied exactly from the email, or "" if none.
- is_festival: true if multi-day festival.
- genres: 1-3 genres describing the artist/festival, chosen ONLY from the GENRE LIST below — copy the strings EXACTLY as written. Use your own knowledge of the artist. Prefer the most specific subgenre you are confident about (e.g. "Riddim" over "Dubstep", "Melodic Techno" over "Techno"); fall back to a broad genre when unsure. Always give your best guess — use [] only if you have absolutely no idea.

GENRE LIST (the only allowed values for "genres"):
${GENRE_PROMPT_LIST}

Deduplicate aggressively. If the email is not a music ticket at all, return {"is_ticket": false, "shows": []}.`;

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });

function tokenFromAddress(addr) {
  if (!addr) return null;
  const re = new RegExp(
    "([a-z0-9._-]+)@" + FORWARD_DOMAIN.replace(/\./g, "\\."),
    "i",
  );
  const m = String(addr).match(re);
  return m ? m[1] : null;
}

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
    const mm = t.match(/\{[\s\S]*\}/);
    if (mm) {
      const parsed = JSON.parse(mm[0]);
      isTicket = !!parsed.is_ticket;
      concerts = Array.isArray(parsed.shows) ? parsed.shows : [];
    }
  } catch (e) {
    await logEvent(userId, subject, "error", "parse failed: " + e.message);
    return json({ ok: false, reason: "parse failed", error: String(e) });
  }

  let saved = 0;
  for (const c of concerts) {
    if (!c || !c.artist || !c.date) continue;
    try {
      // Insert; the unique index on (owner_id, artist, date) makes dedup atomic.
      const { data } = await sb
        .from("concerts")
        .upsert(
          {
            owner_id: userId,
            artist: c.artist,
            venue: c.venue || "",
            city: c.city || "",
            date: c.date,
            end_date: c.end_date || c.date,
            source: c.source || "Email",
            ticket_url: c.ticket_url || "",
            is_festival: !!c.is_festival,
            genres: canonicalizeGenres(c.genres),
            scanned_at: new Date().toISOString(),
          },
          { onConflict: "owner_id,artist,date", ignoreDuplicates: true },
        )
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
