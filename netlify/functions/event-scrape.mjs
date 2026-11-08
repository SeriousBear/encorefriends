// netlify/functions/event-scrape.mjs
//
// Reads a ticket/event page and returns the show details it advertises
// (title, date, city, venue) so the app can double-check what the user saved.
// Pure HTTP + HTML parsing — no API key, no AI, sub-second. Prefers schema.org
// Event JSON-LD, falls back to Open Graph / <meta> tags (covers Shotgun, DICE,
// RA, Eventbrite, Ticketmaster, Bandsintown, …).
//
// SECURITY: only fetches URLs that pass sanitizeTicketUrl — i.e. https links on
// the known-ticket-vendor allowlist. This is what blocks the function from being
// turned into an open proxy (SSRF) against arbitrary/internal hosts.
//
// Call: /.netlify/functions/event-scrape?url=https%3A%2F%2Fshotgun.live%2Fen%2Fevents%2F...

import { sanitizeTicketUrl } from "./parse-helpers.mjs";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
// A browser-like User-Agent — bot-sensitive ticket sites (Shotgun, etc.)
// throttle generic agents with a 429. We only ever fetch public event pages.
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";
const FETCH_HEADERS = {
  "User-Agent": UA,
  Accept: "text/html,application/xhtml+xml",
  "Accept-Language": "en-US,en;q=0.9",
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const MONTHS = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7,
  august: 8, september: 9, october: 10, november: 11, december: 12,
  jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9,
  oct: 10, nov: 11, dec: 12,
};

function decodeEntities(s) {
  return String(s || "")
    .replace(/&amp;/g, "&")
    .replace(/&#(?:0*)39;|&#x0*27;|&apos;/gi, "'")
    .replace(/&quot;|&#(?:0*)34;/gi, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .trim();
}

// Normalize a human/ISO date string to YYYY-MM-DD (date-only, no timezone math).
export function toISODate(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  let m = s.match(/(\d{4})-(\d{2})-(\d{2})/); // ISO / ISO datetime
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const pad = (n) => String(n).padStart(2, "0");
  m = s.match(/\b([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/); // Month D, YYYY
  if (m && MONTHS[m[1].toLowerCase()]) {
    return `${m[3]}-${pad(MONTHS[m[1].toLowerCase()])}-${pad(m[2])}`;
  }
  m = s.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})\.?\s+(\d{4})\b/); // D Month YYYY
  if (m && MONTHS[m[2].toLowerCase()]) {
    return `${m[3]}-${pad(MONTHS[m[2].toLowerCase()])}-${pad(m[1])}`;
  }
  return "";
}

function metaContent(html, prop) {
  const esc = prop.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // <meta property|name="prop" ... content="...">
  let m = html.match(
    new RegExp(
      '<meta[^>]+(?:property|name)=["\']' + esc + '["\'][^>]*?content=["\']([^"\']*)["\']',
      "i",
    ),
  );
  if (m) return decodeEntities(m[1]);
  // content attribute written before property/name
  m = html.match(
    new RegExp(
      '<meta[^>]+content=["\']([^"\']*)["\'][^>]*?(?:property|name)=["\']' + esc + '["\']',
      "i",
    ),
  );
  return m ? decodeEntities(m[1]) : "";
}

function jsonLdEvents(html) {
  const out = [];
  const rx = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = rx.exec(html))) {
    let data;
    try {
      data = JSON.parse(m[1].trim());
    } catch (e) {
      continue;
    }
    const nodes = Array.isArray(data) ? data : data["@graph"] || [data];
    for (const node of nodes) {
      const t = node && node["@type"];
      const types = Array.isArray(t) ? t.join(",") : String(t || "");
      if (/event/i.test(types)) out.push(node);
    }
  }
  return out;
}

// Extract { title, date, city, venue } from a page's HTML.
export function parseEventPage(html) {
  let title = "", date = "", city = "", venue = "";

  const ev = jsonLdEvents(html)[0];
  if (ev) {
    title = decodeEntities(ev.name || "");
    date = toISODate(ev.startDate || ev.startDateTime || "");
    const loc = Array.isArray(ev.location) ? ev.location[0] : ev.location;
    if (loc && typeof loc === "object") {
      venue = decodeEntities(loc.name || "");
      const a = loc.address;
      if (a && typeof a === "object") {
        city = [a.addressLocality, a.addressRegion].filter(Boolean).join(", ");
      } else if (typeof a === "string") {
        city = a;
      }
    }
  }

  // Open Graph / meta fallback (and backfill of any field JSON-LD missed).
  const ogTitle = metaContent(html, "og:title") || metaContent(html, "twitter:title");
  const desc =
    metaContent(html, "og:description") ||
    metaContent(html, "description") ||
    metaContent(html, "twitter:description");

  if (!title && ogTitle) title = ogTitle.replace(/\s[·|]\s.*$/, "").trim();
  if (!date && desc) date = toISODate(desc);
  if (!city && desc) {
    // "… in <City>, <Country> – <date>" (en dash, em dash, or hyphen)
    const m = desc.match(/\bin\s+(.+?)\s+[–—-]\s/i);
    if (m) city = m[1].split(",")[0].trim();
  }

  return { title, date, city: decodeEntities(city), venue };
}

export default async (req) => {
  if (req.method === "OPTIONS") return new Response("", { headers: CORS });

  const url = new URL(req.url).searchParams.get("url") || "";
  const clean = sanitizeTicketUrl(url); // allowlist + https, or "" if not trusted
  if (!clean) {
    return Response.json(
      { ok: false, error: "unsupported or invalid ticket link" },
      { status: 400, headers: CORS },
    );
  }

  try {
    let res;
    // Retry transient throttling (429/503) a couple of times with backoff.
    for (let attempt = 0; attempt < 3; attempt++) {
      res = await fetch(clean, { headers: FETCH_HEADERS, redirect: "follow" });
      if (res.ok || ![429, 503].includes(res.status)) break;
      await sleep(800 * (attempt + 1));
    }
    if (!res.ok) {
      const blocked = [429, 403, 503].includes(res.status);
      return Response.json(
        {
          ok: false,
          status: res.status,
          error: blocked
            ? "the event page blocked the check (" + res.status + ")"
            : "page returned " + res.status,
          url: clean,
        },
        { status: 502, headers: CORS },
      );
    }
    const html = (await res.text()).slice(0, 500000); // cap unexpectedly huge pages
    const info = parseEventPage(html);
    return Response.json({ ok: true, url: clean, ...info }, { headers: CORS });
  } catch (e) {
    return Response.json(
      { ok: false, error: e.message, url: clean },
      { status: 502, headers: CORS },
    );
  }
};
