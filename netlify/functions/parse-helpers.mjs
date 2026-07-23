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
export const PARSE_SYSTEM = `You are an expert MUSIC concert ticket email parser. The user FORWARDED this email to their personal concert tracker, so assume they WANT this show tracked — your job is to extract the live MUSIC event it refers to.

WHAT TO EXTRACT — treat any of these as a show the user is going to:

1. The email concerns a live MUSIC event the user holds or is attending a ticket for. This INCLUDES more than the original purchase confirmation:
   - purchase/order confirmations ("Your order", "Your tickets", "Order #", "Payment received", "Booking confirmation", "Payment plan", "Installment payment")
   - day-of / upcoming-show REMINDERS ("7:00 PM today:", "Your event is tomorrow", "See you tonight", "Reminder: doors at 8")
   - venue-change / reschedule / "moved" / date-change notices for a show they already hold
   - ticket TRANSFERS accepted or sent to the user, and "your tickets are ready / available to download / view your tickets" emails
   Because the user chose to forward it, lean toward is_ticket=true for a real music event even if this specific email is not the original receipt.

   DO NOT INCLUDE: newsletters, "On sale now", "Tickets available", "Just announced", advertisements, presale/on-sale invites, refund/CANCELLATION notices, waitlist emails.

2. MUSIC EVENTS ONLY:
   Concerts, DJ sets, festivals, club nights, raves, after-parties, music tours.
   DO NOT INCLUDE: comedy, sports, theater, conferences, podcasts, talks, museums, movies, food events.

3. MULTI-DAY FESTIVALS — return BOTH start_date and end_date. For single-day events, end_date equals start_date.

4. DEDUPLICATION — if multiple emails reference the same event/order, include the EVENT only ONCE.

Return ONLY a valid JSON object of this exact shape:
{"is_ticket": boolean, "shows": [ ... ], "reason": string}

- is_ticket: true if this email concerns a real live MUSIC event the user holds/attends a ticket for — a confirmation, reminder, change notice, or transfer (concert, festival, DJ set, club night, tour) — even if you could not extract clean details. false for EVERYTHING else: retail orders, food/travel receipts, newsletters, promos, on-sale announcements, cancellations, and non-music events (sports, comedy, theater).
- reason: a SHORT (max ~120 chars) plain-language explanation of your decision — what kind of email this is and why you did or didn't treat it as a show. Example: "Day-of reminder for a concert" or "On-sale promo, not a purchase".
- shows: an array of the qualifying music shows. Each show object:
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

Deduplicate aggressively. If the email is not a music ticket at all, return {"is_ticket": false, "shows": [], "reason": "<why>"}.`;

// Production/evals build the system prompt through this so the model is always
// told TODAY'S DATE — without it, relative dates in reminders ("7:00 PM today",
// "your show is tomorrow") cannot be resolved to a real YYYY-MM-DD.
export function buildParseSystem(now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  return (
    PARSE_SYSTEM +
    `\n\nTODAY'S DATE IS ${today}. Resolve any relative date ("today", "tonight", "tomorrow", a weekday name) against this date and output an absolute YYYY-MM-DD.`
  );
}

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
  if (!mm) return { is_ticket: false, shows: [], reason: "" };
  try {
    const parsed = JSON.parse(mm[0]);
    return {
      is_ticket: !!parsed.is_ticket,
      shows: Array.isArray(parsed.shows) ? parsed.shows : [],
      // Short model-written explanation; capped so a runaway reply can't bloat
      // logs. Defaults to "" when the model omits it.
      reason:
        typeof parsed.reason === "string" ? parsed.reason.slice(0, 120) : "",
    };
  } catch (e) {
    return { is_ticket: false, shows: [], reason: "" };
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
