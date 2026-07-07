// netlify/functions/receive-email.mjs
//
// Receives forwarded ticket emails (and Gmail's forwarding-confirmation email)
// for the auto-tracking feature, matches them to a user by their private
// forward token, and saves any concerts — using the SAME parser as the manual
// scan so results are identical. Saving triggers the existing notify-new-show
// webhook (followers get pushed) and the client's realtime auto-popup.
//
// Point an inbound-email service at this function. With SendGrid Inbound Parse:
//   • Add an MX record on in.encorefriends.com  ->  mx.sendgrid.net (priority 10)
//   • SendGrid → Inbound Parse → host in.encorefriends.com, URL:
//       https://encorefriends.com/.netlify/functions/receive-email?key=YOUR_SECRET
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, URL (Netlify sets this),
//      RECEIVE_SECRET (optional; if set, the ?key= query must match)

import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const FORWARD_DOMAIN = "encorefriends.com";

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

Return ONLY a valid JSON array. Each object:
{"artist": string, "venue": string, "city": string, "date": "YYYY-MM-DD", "end_date": "YYYY-MM-DD", "source": string, "ticket_url": string, "is_festival": boolean}

- artist: performer/band/DJ name. For festivals, use the festival name.
- venue: the venue name from the email. If shown as "TBA"/missing, scan the body for an explicit address or "LOCATION:" line and use that.
- city: "City, State" — taken ONLY from a location/address/city explicitly written in this email. If only an address is given, use its city/state. NEVER guess the city. If none is stated, use "".
- date: start date — REQUIRED.
- end_date: end date — equals date for single-day shows.
- source: ticketing platform (Ticketmaster, SeatGeek, RA, DICE, See Tickets, etc.).
- ticket_url: the direct link for THIS show copied exactly from the email, or "" if none.
- is_festival: true if multi-day festival.

Deduplicate aggressively. Return [] if no qualifying purchases found.`;

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

export default async (req) => {
  // Optional shared secret in the query string.
  if (process.env.RECEIVE_SECRET) {
    const key = new URL(req.url).searchParams.get("key");
    if (key !== process.env.RECEIVE_SECRET)
      return new Response("forbidden", { status: 403 });
  }

  // Inbound providers post form-data (SendGrid/Mailgun); allow JSON too.
  let to = "",
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

  // Which private mailbox did this land in? Prefer the envelope recipient
  // (the real delivery address) over the To header (which Gmail preserves as
  // the user's own address when it forwards).
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

  const bodyText = text || (html ? html.replace(/<[^>]+>/g, " ") : "");

  // ── Gmail's forwarding-confirmation email ──
  if (
    /forwarding-noreply@google\.com/i.test(from) ||
    /forwarding confirmation/i.test(subject)
  ) {
    const codeM = bodyText.match(/\b(\d{9,10})\b/);
    const code = codeM ? codeM[1] : null;
    const linkM = bodyText.match(
      /https:\/\/mail(?:-settings)?\.google\.com\/\S+/i,
    );
    let confirmed = false;
    if (linkM) {
      try {
        const link = linkM[0].replace(/[)>."'\]]+$/, "");
        const r = await fetch(link, { redirect: "follow" });
        confirmed = r.ok;
      } catch (e) {
        /* leave confirmed=false; the code fallback covers it */
      }
    }
    const upd = {};
    if (code) upd.forward_confirm_code = code;
    if (confirmed) upd.forward_verified = true;
    if (Object.keys(upd).length)
      await sb.from("profiles").update(upd).eq("id", userId);
    return json({ ok: true, kind: "gmail-confirm", confirmed, code: !!code });
  }

  // ── A real forwarded email → forwarding is working. ──
  await sb.from("profiles").update({ forward_verified: true }).eq("id", userId);

  // Parse with the same model + prompt as the manual scan.
  let concerts = [];
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
              content:
                (subject ? "Subject: " + subject + "\n\n" : "") + bodyText,
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
    const mm = t.match(/\[[\s\S]*\]/);
    if (mm) concerts = JSON.parse(mm[0]);
  } catch (e) {
    return json({ ok: false, reason: "parse failed", error: String(e) });
  }

  let saved = 0;
  for (const c of concerts) {
    if (!c || !c.artist || !c.date) continue;
    try {
      const { data: existing } = await sb
        .from("concerts")
        .select("id")
        .eq("owner_id", userId)
        .eq("artist", c.artist)
        .eq("date", c.date)
        .maybeSingle();
      if (existing) continue;

      const { data } = await sb
        .from("concerts")
        .insert({
          owner_id: userId,
          artist: c.artist,
          venue: c.venue || "",
          city: c.city || "",
          date: c.date,
          end_date: c.end_date || c.date,
          source: c.source || "Email",
          ticket_url: c.ticket_url || "",
          is_festival: !!c.is_festival,
          genres: [],
          scanned_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (data) {
        await sb
          .from("concert_attendees")
          .insert({ concert_id: data.id, user_id: userId });
        saved++;
      }
    } catch (e) {
      /* skip individual failures */
    }
  }

  return json({ ok: true, kind: "ticket", saved });
};
