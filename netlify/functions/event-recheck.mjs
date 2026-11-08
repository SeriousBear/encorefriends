// netlify/functions/event-recheck.mjs
//
// Daily watcher: re-reads the event page for upcoming shows that have a ticket
// link, and flags any whose details (date / city) have changed since the user
// bought — a venue move, a reschedule. On a change it stores the diff on the
// concert row (page_check) and notifies the owner. It does NOT overwrite the
// show; the owner reviews and taps "Apply" in the app.
//
// Deterministic Open Graph / JSON-LD scrape (parseEventPage) — no API key, no
// AI. Only fetches allowlisted ticket domains (sanitizeTicketUrl), so it can't
// be pointed at arbitrary hosts.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY. Runs on published prod deploys.

import { createClient } from "@supabase/supabase-js";
import { sanitizeTicketUrl } from "./parse-helpers.mjs";
import { parseEventPage } from "./event-scrape.mjs";

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const UA = "EncoreFriends/1.0 (+https://encorefriends.com)";
const MAX_PER_RUN = 20; // keep the run well under Netlify's timeout
const FETCH_TIMEOUT_MS = 6000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const lc = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// Compare the live page against the saved row. Only date and city are trusted
// enough to flag; venue text is too noisy across vendors.
function diffRow(c, page) {
  const d = [];
  if (page.date && page.date !== c.date)
    d.push({ field: "date", was: c.date, now: page.date });
  if (
    page.city &&
    c.city &&
    lc(page.city) &&
    lc(c.city) &&
    !lc(c.city).includes(lc(page.city)) &&
    !lc(page.city).includes(lc(c.city))
  )
    d.push({ field: "city", was: c.city, now: page.city });
  return d;
}

async function fetchPage(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html" },
      redirect: "follow",
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    return parseEventPage((await res.text()).slice(0, 500000));
  } catch (e) {
    return null;
  } finally {
    clearTimeout(t);
  }
}

export default async () => {
  const today = new Date().toISOString().slice(0, 10);
  // Soonest upcoming shows first — that's where a change matters most.
  const { data: rows, error } = await sb
    .from("concerts")
    .select("id,owner_id,artist,date,city,venue,ticket_url,is_festival,page_check")
    .gte("date", today)
    .not("ticket_url", "is", null)
    .neq("ticket_url", "")
    .order("date", { ascending: true })
    .limit(MAX_PER_RUN);

  if (error) {
    console.error("[recheck] query failed:", error.message);
    return new Response("query failed", { status: 500 });
  }

  let checked = 0,
    flagged = 0,
    notified = 0;

  for (const c of rows || []) {
    const url = sanitizeTicketUrl(c.ticket_url);
    if (!url) continue;

    const page = await fetchPage(url);
    await sleep(150); // gentle on vendor sites
    if (!page) continue;
    checked++;

    const diff = diffRow(c, page);
    const prev =
      c.page_check && Array.isArray(c.page_check.diff) ? c.page_check.diff : [];
    const sameAsPrev = JSON.stringify(prev) === JSON.stringify(diff);

    await sb
      .from("concerts")
      .update({
        page_check: { checked_at: new Date().toISOString(), diff, page },
      })
      .eq("id", c.id);

    if (diff.length) {
      flagged++;
      // Only notify when the change is new — don't re-nag every day.
      if (!sameAsPrev) {
        try {
          await sb.from("notifications").insert({
            user_id: c.owner_id,
            type: "show_changed",
            read: false,
            data: {
              concert_id: c.id,
              artist: c.artist,
              what: diff.map((x) => x.field).join(", "),
            },
          });
          notified++;
        } catch (e) {
          /* notifications schema may differ; ignore */
        }
      }
    }
  }

  console.log(
    `[recheck] ${today} checked=${checked} flagged=${flagged} notified=${notified}`,
  );
  return new Response("ok", { status: 200 });
};

export const config = {
  schedule: "0 15 * * *", // 15:00 UTC daily
};
