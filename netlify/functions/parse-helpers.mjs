// netlify/functions/parse-helpers.mjs
//
// The pure, testable pieces of the email -> concert pipeline: the parse
// prompt, forward-token matching, model-output extraction, and row shaping.
// No network, no database — everything here runs in unit tests and evals.
// receive-email.mjs (production) and evals/run-evals.mjs import from here,
// so tests exercise EXACTLY what production runs.

import { GENRE_PROMPT_LIST, canonicalizeGenres } from "./genre-taxonomy.mjs";

export const FORWARD_DOMAIN = "encorefriends.com";

// Same extraction contract as the in-app scan (js/app.js doScan).
export const PARSE_SYSTEM = `You are an expert MUSIC concert ticket email parser. Your job is to extract ONLY confirmed ticket PURCHASES for MUSIC events.

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

export function tokenFromAddress(addr) {
  if (!addr) return null;
  const re = new RegExp(
    "([a-z0-9._-]+)@" + FORWARD_DOMAIN.replace(/\./g, "\\."),
    "i",
  );
  const m = String(addr).match(re);
  return m ? m[1] : null;
}

// Pull the parse result out of a model reply (which may wrap the JSON in
// prose). Malformed replies degrade to "not a ticket" rather than throwing.
export function extractParseResult(text) {
  const mm = String(text || "").match(/\{[\s\S]*\}/);
  if (!mm) return { is_ticket: false, shows: [] };
  try {
    const parsed = JSON.parse(mm[0]);
    return {
      is_ticket: !!parsed.is_ticket,
      shows: Array.isArray(parsed.shows) ? parsed.shows : [],
    };
  } catch (e) {
    return { is_ticket: false, shows: [] };
  }
}

// Shape one parsed show into the row we upsert into `concerts`.
// Returns null when the show must be skipped (no artist or no date).
export function buildConcertRow(c, userId, now = new Date()) {
  if (!c || !c.artist || !c.date) return null;
  return {
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
    scanned_at: now.toISOString(),
  };
}
