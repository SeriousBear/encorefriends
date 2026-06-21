/* ============================================================
   ENCORE — App Logic
   app.js  (React + Babel via CDN)
   ============================================================ */

const { useState, useEffect } = React;
const enc = encodeURIComponent;

// ── CONFIGg ──────────────────────────────────────────────────────────────────
const ANTHROPIC_API_KEY = "YOUR_ANTHROPIC_API_KEY_HERE";
const GOOGLE_CLIENT_ID =
  "534883382276-a4n9v88cgj5ob8i989hgukucpkkdka53.apps.googleusercontent.com";
const SUPABASE_URL = "https://zfcehcqklrrfncihjwkk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_LhcC2ZeRoWsD3eAGNIUfwg_iSJyJqip";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── RESELLERS ───────────────────────────────────────────────────────────────
const RESELLERS = [
  {
    name: "CashorTrade",
    tag: "Fan-to-fan · face value",
    color: "#2ECC71",
    url: (a) => "https://www.cashortradetickets.com/search?q=" + enc(a),
  },
  {
    name: "StubHub",
    tag: "Large resale inventory",
    color: "#E85D3A",
    url: (a) => "https://www.stubhub.com/find/s/?q=" + enc(a),
  },
  {
    name: "SeatGeek",
    tag: "Price comparison engine",
    color: "#3498DB",
    url: (a) =>
      "https://seatgeek.com/" +
      a.toLowerCase().replace(/[^a-z0-9]+/g, "-") +
      "-tickets",
  },
  {
    name: "Vivid Seats",
    tag: "Last-minute deals",
    color: "#9B6BF5",
    url: (a) => "https://www.vividseats.com/search?searchTerm=" + enc(a),
  },
  {
    name: "DICE",
    tag: "Artist-approved resale",
    color: "#F39C12",
    url: (a) => "https://dice.fm/search?q=" + enc(a),
  },
];

// ── STREAMING ───────────────────────────────────────────────────────────────
const STREAMS = [
  {
    name: "Spotify",
    color: "#1DB954",
    bg: "rgba(29,185,84,.12)",
    border: "rgba(29,185,84,.25)",
    url: (a) => "https://open.spotify.com/search/" + enc(a),
  },
  {
    name: "Apple Music",
    color: "#FC3C44",
    bg: "rgba(252,60,68,.12)",
    border: "rgba(252,60,68,.25)",
    url: (a) => "https://music.apple.com/us/search?term=" + enc(a),
  },
  {
    name: "YouTube Music",
    color: "#FF4444",
    bg: "rgba(255,68,68,.1)",
    border: "rgba(255,68,68,.2)",
    url: (a) => "https://music.youtube.com/search?q=" + enc(a),
  },
  {
    name: "Amazon Music",
    color: "#00A8E1",
    bg: "rgba(0,168,225,.1)",
    border: "rgba(0,168,225,.2)",
    url: (a) => "https://music.amazon.com/search/" + enc(a),
  },
  {
    name: "Tidal",
    color: "#00CDCD",
    bg: "rgba(0,205,205,.1)",
    border: "rgba(0,205,205,.2)",
    url: (a) => "https://tidal.com/search?q=" + enc(a),
  },
  {
    name: "SoundCloud",
    color: "#FF5500",
    bg: "rgba(255,85,0,.1)",
    border: "rgba(255,85,0,.2)",
    url: (a) => "https://soundcloud.com/search?q=" + enc(a),
  },
  {
    name: "Bandcamp",
    color: "#1DA0C3",
    bg: "rgba(29,160,195,.1)",
    border: "rgba(29,160,195,.2)",
    url: (a) => "https://bandcamp.com/search?q=" + enc(a),
  },
  {
    name: "Beatport",
    color: "#02FF6C",
    bg: "rgba(2,255,108,.08)",
    border: "rgba(2,255,108,.18)",
    url: (a) => "https://www.beatport.com/search?q=" + enc(a),
  },
];

const SOURCES = [
  "Ticketmaster",
  "SeatGeek",
  "Live Nation",
  "Eventbrite",
  "StubHub",
  "AXS",
  "DICE",
  "TickPick",
  "Direct",
  "Other",
];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const GENRES = [
  "Techno",
  "House",
  "Deep House",
  "Tech House",
  "Minimal Techno",
  "Melodic Techno",
  "Progressive House",
  "Trance",
  "Psytrance",
  "Drum & Bass",
  "Dubstep",
  "UK Garage",
  "2-Step",
  "Breakbeat",
  "Bass",
  "Future Bass",
  "Ambient",
  "IDM",
  "Electro",
  "EDM",
  "Big Room",
  "Hardstyle",
  "Hardcore",
  "Gabber",
  "Jungle",
  "Footwork",
  "Downtempo",
  "Trip-Hop",
  "Synthwave",
  "Vaporwave",
  "Disco",
  "Nu-Disco",
  "Italo Disco",
  "Acid House",
  "Electronica",
  "Glitch",
  "Drone",
  "Hip-Hop",
  "Rap",
  "Trap",
  "Drill",
  "Boom Bap",
  "Cloud Rap",
  "Grime",
  "R&B",
  "Neo-Soul",
  "Soul",
  "Funk",
  "Motown",
  "Afrobeats",
  "Amapiano",
  "Rock",
  "Classic Rock",
  "Indie Rock",
  "Alternative Rock",
  "Punk",
  "Post-Punk",
  "Hardcore Punk",
  "Pop Punk",
  "Emo",
  "Metal",
  "Heavy Metal",
  "Death Metal",
  "Black Metal",
  "Metalcore",
  "Grunge",
  "Shoegaze",
  "Psychedelic Rock",
  "Garage Rock",
  "Math Rock",
  "Post-Rock",
  "Prog Rock",
  "Stoner Rock",
  "Industrial",
  "Pop",
  "Indie Pop",
  "Synth-Pop",
  "Dream Pop",
  "Hyperpop",
  "K-Pop",
  "J-Pop",
  "Electropop",
  "Art Pop",
  "Bedroom Pop",
  "Jazz",
  "Smooth Jazz",
  "Bebop",
  "Jazz Fusion",
  "Swing",
  "Blues",
  "Soul Blues",
  "Folk",
  "Indie Folk",
  "Singer-Songwriter",
  "Country",
  "Americana",
  "Bluegrass",
  "Folk Rock",
  "Latin",
  "Reggaeton",
  "Salsa",
  "Cumbia",
  "Bossa Nova",
  "Samba",
  "Flamenco",
  "Afrobeat",
  "Highlife",
  "Dancehall",
  "Reggae",
  "Dub",
  "Ska",
  "Soca",
  "Classical",
  "Opera",
  "Contemporary Classical",
  "Film Score",
  "Soundtrack",
  "Gospel",
  "World",
  "Experimental",
  "Noise",
  "New Age",
  "Lo-Fi",
  "Spoken Word",
];

const ARTIST_SUGG = [
  "Subtronics",
  "John Summit",
  "Rezz",
  "deadmau5",
  "Fisher",
  "Fred Again..",
  "Eric Prydz",
  "Dom Dolla",
  "Four Tet",
  "Skrillex",
  "Flume",
  "Peggy Gou",
  "Mall Grab",
  "Solomun",
  "Tale Of Us",
  "Nina Kraviz",
  "Charlotte de Witte",
  "Aphex Twin",
  "Floating Points",
  "Jon Hopkins",
  "Richie Hawtin",
  "Adam Beyer",
  "Amelie Lens",
  "BICEP",
  "Bonobo",
  "Jamie xx",
  "Justice",
  "Kaskade",
  "Lane 8",
  "Maceo Plex",
  "Moderat",
  "Orbital",
  "Phantogram",
  "GRiZ",
  "Illenium",
  "Martin Garrix",
  "Porter Robinson",
  "Odesza",
  "Chris Liebing",
  "Stephan Bodzin",
];

const AVATAR_COLORS = [
  "#F5A623",
  "#E85D3A",
  "#9B6BF5",
  "#2ECC71",
  "#3498DB",
  "#E91E8C",
  "#1ABC9C",
  "#E74C3C",
  "#8E44AD",
  "#F39C12",
  "#27AE60",
  "#2980B9",
  "#D35400",
  "#16A085",
  "#7F8C8D",
  "#C0392B",
];

// Demo seed data removed in Pass 2 — profiles & concerts now load from Supabase.


// ── HELPERS ─────────────────────────────────────────────────────────────────
const now0 = () => {
  const n = new Date();
  n.setHours(0, 0, 0, 0);
  return n;
};
const getUrgency = (ds) => {
  const d = Math.ceil((new Date(ds + "T00:00:00") - now0()) / 86400000);
  return d < 0 ? "past" : d <= 14 ? "urgent" : d <= 30 ? "soon" : "normal";
};
const daysUntil = (ds) =>
  Math.ceil((new Date(ds + "T00:00:00") - now0()) / 86400000);
const fmt = (ds) => {
  const d = new Date(ds + "T12:00:00");
  return {
    mo: MONTHS[d.getMonth()].toUpperCase(),
    day: d.getDate(),
    dow: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][d.getDay()],
    full: `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`,
  };
};
const uColor = (u) =>
  u === "urgent" ? "#FF5050" : u === "soon" ? "#F5A623" : "#2a2a2a";
// ── TICKET VENDORS ──────────────────────────────────────────────────────────
// Single source of truth for ticketing platforms. To support a new ticket
// site, add ONE entry here: its display name, any aliases the scan might
// return for it, and its sender domain(s). That entry then drives, automatically:
//   1. the "Buy on …" link destination (a Resident Advisor show links to
//      Resident Advisor, not Ticketmaster),
//   2. the label on the button,
//   3. an extra Gmail search pass so that platform's emails get scanned.
const TICKET_VENDORS = [
  { name: "Ticketmaster", aliases: ["ticketmaster", "tm"], domains: ["ticketmaster.com"], eventRx: /ticketmaster\.com\/event\/([A-Za-z0-9]+)/i, eventUrl: (id) => "https://www.ticketmaster.com/event/" + id },
  { name: "Live Nation", aliases: ["live nation", "livenation"], domains: ["livenation.com"] },
  { name: "SeatGeek", aliases: ["seatgeek"], domains: ["seatgeek.com"] },
  { name: "AXS", aliases: ["axs"], domains: ["axs.com"], eventRx: /axs\.com\/events\/(\d+)/i, eventUrl: (id) => "https://www.axs.com/events/" + id },
  { name: "DICE", aliases: ["dice", "dice.fm"], domains: ["dice.fm"], eventRx: /dice\.fm\/event\/([\w-]+)/i, eventUrl: (id) => "https://dice.fm/event/" + id },
  { name: "Resident Advisor", aliases: ["resident advisor", "ra", "residentadvisor"], domains: ["ra.co", "residentadvisor.net"], eventRx: /ra\.co\/events\/(\d+)/i, eventUrl: (id) => "https://ra.co/events/" + id },
  { name: "See Tickets", aliases: ["see tickets", "seetickets"], domains: ["seetickets.us", "seetickets.com"] },
  { name: "Eventbrite", aliases: ["eventbrite"], domains: ["eventbrite.com", "eventbritemail.com"], eventRx: /eventbrite\.com\/e\/([\w-]+)/i, eventUrl: (id) => "https://www.eventbrite.com/e/" + id },
  { name: "Etix", aliases: ["etix"], domains: ["etix.com"] },
  { name: "Tixr", aliases: ["tixr"], domains: ["tixr.com"] },
  { name: "Vivid Seats", aliases: ["vivid seats", "vividseats"], domains: ["vividseats.com"] },
  { name: "TickPick", aliases: ["tickpick"], domains: ["tickpick.com"] },
  { name: "ShowClix", aliases: ["showclix"], domains: ["showclix.com"] },
  { name: "StubHub", aliases: ["stubhub"], domains: ["stubhub.com"] },
  { name: "Front Gate Tickets", aliases: ["front gate", "frontgate", "frontgatetickets"], domains: ["frontgatetickets.com"] },
  { name: "Universe", aliases: ["universe"], domains: ["universe.com"] },
  { name: "Bandsintown", aliases: ["bandsintown"], domains: ["bandsintown.com"] },
  { name: "TicketWeb", aliases: ["ticketweb"], domains: ["ticketweb.com"] },
  { name: "Eventim", aliases: ["eventim"], domains: ["eventim.com"] },
];

// Match a scanned source string ("RA", "Resident Advisor", "ra.co" …) to a vendor.
const findVendor = (source) => {
  if (!source) return null;
  const s = String(source).toLowerCase().trim();
  return (
    TICKET_VENDORS.find((v) => v.name.toLowerCase() === s) ||
    TICKET_VENDORS.find(
      (v) =>
        v.aliases.includes(s) ||
        v.domains.some((d) => s.includes(d)) ||
        v.aliases.some((a) => s.includes(a)),
    ) ||
    null
  );
};

// Resolve the DIRECT purchase link for a concert. Returns a trustworthy event
// URL, or null — there is no search fallback. A captured URL is used only when
// it sits on the show's known vendor domain.
const primaryUrl = (c) => {
  const captured = c.ticketUrl || c.ticket_url; // seed data camelCase, DB rows snake_case
  if (!captured || !/^https?:\/\//i.test(captured)) return null;
  if (c.is_festival) return captured; // festival's own site, validated on save
  const v = findVendor(c.source);
  if (v && !v.domains.some((d) => captured.includes(d))) return null;
  return captured;
};

// Label for the buy button; null when the source is unknown/generic.
const vendorLabel = (c) => {
  const v = findVendor(c.source);
  if (v) return v.name;
  const s = String(c.source || "").toLowerCase();
  if (c.source && !["direct", "unknown", ""].includes(s)) return c.source;
  return null;
};
const stars = (n) => "★".repeat(n) + "☆".repeat(5 - n);

// ── STYLES ──────────────────────────────────────────────────────────────────
// Styles loaded from css/app.css

// ── GMAIL SCAN ──────────────────────────────────────────────────────────────
async function doScan(setSt, setPr, userId) {
  setSt("Connecting to Google…");
  if (!window.google?.accounts?.oauth2)
    throw new Error("Add the Google GSI script tag.");
  const tc = window.google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: "https://www.googleapis.com/auth/gmail.readonly",
    callback: () => {},
  });
  const token = await new Promise((res, rej) => {
    // Backstop: if the consent popup is closed or abandoned, the success
    // callback never fires — so reject on error_callback and on a timeout,
    // otherwise the scan would hang on "Connecting to Google…" forever.
    const timer = setTimeout(
      () => rej(new Error("Timed out connecting to Google.")),
      120000,
    );
    tc.callback = (r) => {
      clearTimeout(timer);
      r.error ? rej(r) : res(r.access_token);
    };
    tc.error_callback = (e) => {
      clearTimeout(timer);
      rej(new Error((e && e.type) || "Google sign-in was cancelled."));
    };
    tc.requestAccessToken({ prompt: "consent" });
  });

  setPr(10);
  setSt("Searching inbox…");

  // Multiple search passes to maximize coverage across ALL ticket platforms
  const searches = [
    // Vendor domain passes are generated from TICKET_VENDORS just below this
    // array, so adding a vendor to that registry also extends inbox coverage.
    // Catch-all for noreply addresses from ticket senders
    "from:(noreply OR no-reply OR notifications OR tickets OR orders) (ticket OR ticketing OR event OR concert OR booking OR admission)",
    // RA specifically by domain
    "from:ra.co OR from:residentadvisor.net",
    // See Tickets specifically
    "from:seetickets.us OR from:seetickets.com",
    // Subject patterns — any sender
    'subject:("your tickets" OR "your ticket" OR "ticket confirmation" OR "e-ticket" OR "order confirmation" OR "purchase confirmation")',
    // Booking/order patterns
    'subject:("booking confirmation" OR "your order" OR "your booking" OR "order #" OR "you\'re going")',
    // Receipt-style — catches small venues and local promoters
    "subject:(receipt OR confirmation) (ticket OR admission OR pass OR entry OR show OR concert OR event OR festival OR party)",
    // Wide net — any ticket email in last 2 years
    "subject:(ticket OR tickets OR admission) newer_than:2y",
    // Payment plan emails — specifically targets Movement-style subjects
    "from:seetickets.us subject:(payment OR order OR receipt)",
    "subject:(payment plan) (festival OR concert OR show OR event OR ticket)",
  ];

  // Generate a domain-based search pass for every vendor in the registry,
  // chunked so each Gmail query stays short. Adding a vendor above is enough
  // to have its emails scanned here — no need to edit this list by hand.
  for (let i = 0; i < TICKET_VENDORS.length; i += 6) {
    const domains = TICKET_VENDORS.slice(i, i + 6).flatMap((v) => v.domains);
    searches.push("from:(" + domains.map((d) => "@" + d).join(" OR ") + ")");
  }

  // Run all searches and deduplicate by message id
  const seen = new Set();
  const allMsgs = [];
  console.log("=== ENCORE GMAIL SCAN START ===");
  console.log(
    "Got OAuth token:",
    token ? "YES (" + token.substring(0, 20) + "...)" : "NO",
  );
  for (let s = 0; s < searches.length; s++) {
    setPr(10 + Math.round((s / searches.length) * 25));
    console.log("Search " + (s + 1) + "/" + searches.length + ":", searches[s]);
    try {
      const res = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages?q=" +
          enc(searches[s]) +
          "&maxResults=30",
        { headers: { Authorization: "Bearer " + token } },
      );
      const data = await res.json();
      console.log(
        "  → Returned " +
          (data.messages?.length || 0) +
          " messages | Estimate: " +
          (data.resultSizeEstimate || 0),
      );
      if (data.error) console.error("  → GMAIL API ERROR:", data.error);
      for (const msg of data.messages || []) {
        if (!seen.has(msg.id)) {
          seen.add(msg.id);
          allMsgs.push(msg);
        }
      }
    } catch (e) {
      console.error("  → Search failed:", e);
    }
  }
  console.log("=== TOTAL UNIQUE EMAILS: " + allMsgs.length + " ===");

  setPr(35);
  setSt("Reading " + allMsgs.length + " emails…");

  // Decode a base64url-encoded Gmail body part to a UTF-8 string
  const b64urlDecode = (data) => {
    try {
      const bin = atob(data.replace(/-/g, "+").replace(/_/g, "/"));
      // Handle UTF-8 multi-byte characters correctly
      const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
      return new TextDecoder("utf-8").decode(bytes);
    } catch (e) {
      return "";
    }
  };

  // Walk the MIME tree and return the best body source.
  // Prefers text/html (richest content); falls back to text/plain.
  const extractRawBody = (payload) => {
    if (!payload) return { html: "", text: "" };
    let html = "";
    let text = "";
    const walk = (part) => {
      if (!part) return;
      const mime = part.mimeType || "";
      if (part.body?.data) {
        if (mime === "text/html" && !html) html = b64urlDecode(part.body.data);
        else if (mime === "text/plain" && !text)
          text = b64urlDecode(part.body.data);
      }
      if (part.parts) part.parts.forEach(walk);
    };
    walk(payload);
    return { html, text };
  };

  // Convert an HTML email body to clean plain text using the browser's own
  // parser. Strips style/script/head content (not just tags), collapses
  // whitespace, and caps length to keep token usage predictable.
  const cleanEmailBody = (html) => {
    try {
      const doc = new DOMParser().parseFromString(html, "text/html");
      doc.querySelectorAll("style, script, head, title").forEach((el) =>
        el.remove(),
      );
      const txt = doc.body?.innerText || doc.body?.textContent || "";
      return txt.replace(/\s{2,}/g, " ").trim();
    } catch (e) {
      // Fallback: naive tag strip if DOMParser somehow fails
      return html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim();
    }
  };

  // Find direct event-page links by scanning the RAW email (HTML + plain-text
  // parts, lightly URL-decoded so links buried inside tracking redirects are
  // still found) for each vendor's canonical event-URL pattern, then rebuilding
  // a clean link. Robust to "View event" buttons whose href is a click-tracker,
  // as long as the real event URL appears somewhere in the email.
  const extractEventLinks = (html, text) => {
    let raw = (html || "") + "\n" + (text || "");
    raw += "\n" + raw.replace(/%2F/gi, "/").replace(/%3A/gi, ":");
    const found = [];
    for (const v of TICKET_VENDORS) {
      if (!v.eventRx) continue;
      const rx = new RegExp(v.eventRx.source, "ig");
      let m;
      while ((m = rx.exec(raw))) found.push(v.eventUrl(m[1]));
    }
    return [...new Set(found)].slice(0, 4);
  };

  // For festivals we link to the festival's own website (which then routes the
  // buyer wherever they need). Collect external homepage links from the email —
  // excluding ticket vendors (handled above) and obvious social/tracking/infra
  // domains — and normalize to the site origin so the link is stable.
  const SITE_DENY = [
    "facebook.", "instagram.", "twitter.", "x.com", "youtube.", "youtu.be",
    "spotify.", "soundcloud.", "tiktok.", "apple.com", "google.", "linkedin.",
    "threads.net", "mailchimp", "list-manage", "sendgrid", "unsubscribe",
  ];
  const extractSiteLinks = (html) => {
    try {
      const doc = new DOMParser().parseFromString(html, "text/html");
      const origins = [];
      for (const a of doc.querySelectorAll("a[href]")) {
        const href = a.getAttribute("href") || "";
        if (!/^https?:\/\//i.test(href)) continue;
        const low = href.toLowerCase();
        if (TICKET_VENDORS.some((v) => v.domains.some((d) => low.includes(d))))
          continue;
        if (SITE_DENY.some((d) => low.includes(d))) continue;
        try {
          const o = new URL(href).origin;
          if (!origins.includes(o)) origins.push(o);
        } catch (e) {}
      }
      return origins.slice(0, 4);
    } catch (e) {
      return [];
    }
  };

  // Accept a ticket_url only if it's real: a proper URL that actually appeared
  // in a scanned email (guards against the model inventing one). For regular
  // shows it must sit on the known vendor's domain; for festivals it's the
  // festival's own site, so the vendor-domain check doesn't apply.
  const validTicketUrl = (url, source, isFestival) => {
    if (!url || !/^https?:\/\//i.test(url)) return "";
    if (!bodies.some((b) => b.includes(url))) return "";
    if (isFestival) return url;
    const v = findVendor(source);
    if (v && !v.domains.some((d) => url.includes(d))) return "";
    return url;
  };

  const BODY_CHAR_CAP = 800;

  // Fetch full content for top 75 unique emails and extract clean body text
  const bodies = [];
  const toFetch = allMsgs.slice(0, 75);
  for (let i = 0; i < toFetch.length; i++) {
    try {
      const m = await (
        await fetch(
          "https://gmail.googleapis.com/gmail/v1/users/me/messages/" +
            toFetch[i].id +
            "?format=full",
          { headers: { Authorization: "Bearer " + token } },
        )
      ).json();
      const subj =
        (m.payload?.headers?.find((h) => h.name === "Subject") || {}).value ||
        "";
      const from =
        (m.payload?.headers?.find((h) => h.name === "From") || {}).value || "";
      const date =
        (m.payload?.headers?.find((h) => h.name === "Date") || {}).value || "";

      // Universal body extraction: decode the full body, clean it to plain
      // text, and cap it. Fall back to the snippet if extraction is empty.
      const { html, text } = extractRawBody(m.payload);
      let bodyText = "";
      if (html) bodyText = cleanEmailBody(html);
      if (!bodyText && text) bodyText = text.replace(/\s{2,}/g, " ").trim();
      if (!bodyText) bodyText = m.snippet || "";
      bodyText = bodyText.slice(0, BODY_CHAR_CAP);

      const eventLinks = extractEventLinks(html, text);
      const siteLinks = extractSiteLinks(html);
      bodies.push(
        "From: " +
          from +
          "\nSubject: " +
          subj +
          "\nDate: " +
          date +
          "\nBody: " +
          bodyText +
          (eventLinks.length ? "\nLinks: " + eventLinks.join(" ") : "") +
          (siteLinks.length ? "\nSite: " + siteLinks.join(" ") : ""),
      );
    } catch (e) {
      /* skip failed fetches */
    }
    setPr(35 + Math.round((i / toFetch.length) * 40));
  }

  if (bodies.length === 0) return [];

  setPr(78);
  setSt("Parsing " + bodies.length + " emails with AI…");

  const ai = await fetch("/.netlify/functions/claude", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 8000,
      system: `You are an expert MUSIC concert ticket email parser. Your job is to extract ONLY confirmed ticket PURCHASES for MUSIC events.

STRICT RULES — EXTRACT ONLY EMAILS THAT MATCH ALL OF THESE:

1. CONFIRMED PURCHASES ONLY — the user must have actually bought a ticket. Look for phrases like:
   ✓ "Your order", "Your tickets", "You're going", "Order confirmation", "Payment received", "Booking confirmation", "Order #", "Payment plan", "Installment payment"
   ✗ DO NOT INCLUDE: newsletters, "On sale now", "Tickets available", "Don't miss", "Just announced", "Save the date", advertisements, presale invites, refund/cancel notices, waitlist emails, "we thought you'd like"

2. MUSIC EVENTS ONLY:
   ✓ Concerts, DJ sets, festivals, club nights, raves, after-parties, music tours
   ✗ DO NOT INCLUDE: comedy shows, sports events, theater, conferences, sporting events, podcasts, talks, speaking events, museum tickets, movies, food events

3. MULTI-DAY FESTIVALS — return BOTH start_date and end_date. For single-day events, end_date equals start_date.

4. PAYMENT PLAN DEDUPLICATION — if multiple payment confirmation emails reference the same event/order, include the EVENT only ONCE.

Return ONLY a valid JSON array. Each object:
{"artist": string, "venue": string, "city": string, "date": "YYYY-MM-DD", "end_date": "YYYY-MM-DD", "source": string, "ticket_url": string, "is_festival": boolean}

- artist: performer/band/DJ name. For festivals, use the festival name (e.g. "Movement Festival")
- venue: venue or festival site
- city: "City, State"
- date: start date — REQUIRED
- end_date: end date — for single-day shows equals date
- source: ticketing platform (Ticketmaster, SeatGeek, RA, See Tickets, etc.)
- ticket_url: the direct link for THIS show, copied EXACTLY from this email — never invented. For a FESTIVAL, use the festival's official website from this email's "Site:" line. For a regular show, use the matching event URL from the "Links:" line. If neither has a suitable link, use "".
- is_festival: true if multi-day festival

Deduplicate aggressively. Return [] if no qualifying purchases found.`,
      messages: [{ role: "user", content: bodies.join("\n\n---EMAIL---\n\n") }],
    }),
  });

  const d = await ai.json();
  console.log("=== AI RESPONSE ===", d);
  if (d.error) console.error("AI ERROR:", d.error);
  const t = (d.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
  console.log("AI extracted text:", t);
  const match = t.match(/\[[\s\S]*\]/);
  if (!match) {
    console.warn("No JSON array found in AI response");
    return [];
  }

  const parsed = JSON.parse(match[0]);
  console.log("=== PARSED CONCERTS:", parsed.length, "===", parsed);
  setPr(92);
  setSt("Saving to your account…");

  // Save to Supabase if we have a userId
  const saved = [];
  if (userId) {
    for (const c of parsed) {
      try {
        // Check if this concert already exists (artist+date for this user)
        const { data: existing } = await supabase
          .from("concerts")
          .select("id")
          .eq("owner_id", userId)
          .eq("artist", c.artist)
          .eq("date", c.date)
          .maybeSingle();
        if (existing) continue; // skip duplicate (same event across emails)

        const { data, error } = await supabase
          .from("concerts")
          .insert({
            owner_id: userId,
            artist: c.artist,
            venue: c.venue || "",
            city: c.city || "",
            date: c.date,
            end_date: c.end_date || c.date,
            source: findVendor(c.source)?.name || c.source || "Unknown",
            ticket_url: validTicketUrl(c.ticket_url, c.source, c.is_festival),
            is_festival: c.is_festival || false,
            genres: [],
            scanned_at: new Date().toISOString(),
          })
          .select()
          .single();
        if (data) {
          await supabase.from("concert_attendees").insert({
            concert_id: data.id,
            user_id: userId,
          });
          saved.push({ ...data, attendees: [userId] });
        }
      } catch (e) {
        /* skip errors */
      }
    }
    return saved;
  }

  // Fallback — return without saving
  return parsed.map((c, i) => ({
    ...c,
    ticket_url: validTicketUrl(c.ticket_url, c.source, c.is_festival),
    id: Date.now() + i,
    attendees: [0],
  }));
}

// ── CONCERT CARD ─────────────────────────────────────────────────────────────
function CCard({
  c,
  users,
  curUser,
  onOpen,
  onToggleGoing,
  onViewProfile,
  onDelete,
}) {
  const d = fmt(c.date),
    u = getUrgency(c.date),
    dy = daysUntil(c.date);
  const cc = u === "urgent" ? "card-u" : u === "soon" ? "card-s" : "card-n";
  const going = c.attendees?.includes(curUser.id);

  // Recently scanned within the last 24 hours?
  const isNew =
    c.scanned_at &&
    Date.now() - new Date(c.scanned_at).getTime() < 24 * 60 * 60 * 1000;

  // Multi-day festival
  const isMultiDay = c.is_festival && c.end_date && c.end_date !== c.date;
  const dateDisplay = isMultiDay
    ? fmt(c.date).mo + " " + fmt(c.date).day + "–" + fmt(c.end_date).day
    : null;

  return (
    <div className={"card " + cc} onClick={() => onOpen(c)}>
      <div className="cbar" style={{ background: uColor(u) }} />
      <div className="cbody">
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            display: "flex",
            gap: 5,
            zIndex: 2,
          }}
        >
          {isNew && (
            <div
              style={{
                padding: "2px 7px",
                background: "rgba(245,166,35,.15)",
                border: "1px solid rgba(245,166,35,.4)",
                borderRadius: 3,
                fontFamily: "'DM Mono',monospace",
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: 1,
                color: "#F5A623",
                textTransform: "uppercase",
              }}
            >
              NEW
            </div>
          )}
          {c.is_festival && (
            <div
              style={{
                padding: "2px 7px",
                background: "rgba(155,107,245,.12)",
                border: "1px solid rgba(155,107,245,.35)",
                borderRadius: 3,
                fontFamily: "'DM Mono',monospace",
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: 1,
                color: "#9B6BF5",
                textTransform: "uppercase",
              }}
            >
              FEST
            </div>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(c.id);
              }}
              style={{
                padding: "2px 7px",
                background: "transparent",
                border: "1px solid #2a2a2a",
                borderRadius: 3,
                fontFamily: "'DM Mono',monospace",
                fontSize: 9,
                color: "#444",
                cursor: "pointer",
                lineHeight: 1,
              }}
              title="Remove this show"
            >
              ×
            </button>
          )}
        </div>
        {u === "urgent" && (
          <div className="upill pill-u">
            <div className="pdot" style={{ background: "#FF5050" }} />
            {dy === 0 ? "tonight" : dy === 1 ? "tomorrow" : dy + " days left"}
          </div>
        )}
        {u === "soon" && (
          <div className="upill pill-s">
            <div className="pdot" style={{ background: "#F5A623" }} />
            {dy} days away
          </div>
        )}
        <div className="drow">
          <div className="dbdg">
            <div className="dmo">{d.mo}</div>
            <div className="ddy">{d.day}</div>
            <div className="ddw">
              {isMultiDay ? "→ " + fmt(c.end_date).day : d.dow}
            </div>
          </div>
          <div className="dart">{c.artist}</div>
        </div>
        <div className="dven">{c.venue}</div>
        <div className="dcit">{c.city}</div>
      </div>
      <div className="cfoot" onClick={(e) => e.stopPropagation()}>
        <div className="ftags">
          {(c.attendees || []).slice(0, 5).map((uid) => {
            const u2 = users.find((u) => u.id === uid);
            return u2 ? (
              <div
                key={uid}
                className="ftag"
                style={{ background: u2.color }}
                title={"View " + u2.name + "'s profile"}
                onClick={(e) => {
                  e.stopPropagation();
                  onViewProfile && onViewProfile(uid);
                }}
              >
                {u2.name.slice(0, 2).toUpperCase()}
              </div>
            ) : null;
          })}
          <button className="tagbtn" onClick={() => onOpen(c)}>
            + tag
          </button>
        </div>
        <div
          className={"tkbdg " + (going ? "tk-on" : "tk-off")}
          onClick={() => onToggleGoing(c.id)}
        >
          {going ? "✓ going" : "not going"}
        </div>
      </div>
    </div>
  );
}

// ── CONCERT DETAIL SHEET ──────────────────────────────────────────────────────
function CDetail({
  c,
  users,
  curUser,
  onClose,
  onToggleAttendee,
  onViewProfile,
}) {
  const u = getUrgency(c.date),
    dy = daysUntil(c.date),
    d = fmt(c.date);
  const dt = dy === 0 ? "Tonight!" : dy === 1 ? "Tomorrow!" : dy + " days away";
  const bc = u === "urgent" ? "bdg-u" : u === "soon" ? "bdg-s" : "bdg-n",
    rc = u === "urgent" ? "#FF5555" : "#F5A623";
  const showR = u === "urgent" || u === "soon";
  const isFestival = c.is_festival && c.end_date && c.end_date !== c.date;
  const dateStr = isFestival
    ? fmt(c.date).full + " – " + fmt(c.end_date).full
    : d.dow + ", " + d.full;
  return (
    <div className="mwrap" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-bar" style={{ background: uColor(u) }} />
        <div className="sheet-handle" />
        <div className="sheet-body">
          <div className="sh-artist">{c.artist}</div>
          <div className="sh-venue">{c.venue}</div>
          <div className="sh-date">
            {c.city} · {dateStr}
          </div>
          <div className={"sh-daybdg " + bc}>
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background:
                  u === "urgent"
                    ? "#FF5555"
                    : u === "soon"
                      ? "#F5A623"
                      : "#444",
                display: "inline-block",
              }}
            />
            {dt}
          </div>
          <div className="sh-lbl nb">Get Tickets</div>
          {primaryUrl(c) ? (
            <a
              className="sh-buy"
              href={primaryUrl(c)}
              target="_blank"
              rel="noreferrer"
            >
              <span>
                {vendorLabel(c) ? "Buy on " + vendorLabel(c) : "Get Tickets"}
              </span>
              <span className="sh-buy-src">Official ↗</span>
            </a>
          ) : (
            <div className="sh-buy sh-buy-nolink">
              <span>
                {vendorLabel(c) ? "Via " + vendorLabel(c) : "Ticket link unavailable"}
              </span>
              <span className="sh-buy-src">no direct link</span>
            </div>
          )}
          {showR && (
            <>
              <div className="rsh" style={{ color: rc }}>
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: rc,
                    display: "inline-block",
                  }}
                />
                {u === "urgent"
                  ? "Last-minute resale"
                  : "Coming up — find extras here"}
              </div>
              <div className="rsg">
                {RESELLERS.map((r) => (
                  <a
                    key={r.name}
                    className="rsl"
                    href={r.url(c.artist)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <div className="rsd" style={{ background: r.color }} />
                      <div>
                        <div className="rsn">{r.name}</div>
                        <div className="rst">{r.tag}</div>
                      </div>
                    </div>
                    <div className="rsa">↗</div>
                  </a>
                ))}
              </div>
            </>
          )}
          <div className="sh-lbl">Listen to {c.artist}</div>
          <div className="sg">
            {STREAMS.map((s) => (
              <a
                key={s.name}
                className="sl"
                href={s.url(c.artist)}
                target="_blank"
                rel="noreferrer"
                style={{ background: s.bg, border: "1px solid " + s.border }}
              >
                <div className="sdot" style={{ background: s.color }} />
                <span className="sn" style={{ color: s.color }}>
                  {s.name}
                </span>
                <span className="sa">↗</span>
              </a>
            ))}
          </div>
          <div className="sh-lbl">Who's Going</div>
          {users.map((u2) => {
            const sel = (c.attendees || []).includes(u2.id);
            const isMe = u2.id === curUser.id;
            return (
              <div
                key={u2.id}
                className={"who-row" + (sel ? " who-sel" : "")}
                onClick={() => onToggleAttendee(c.id, u2.id)}
              >
                <div
                  className="who-av"
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: u2.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 8,
                    fontWeight: 700,
                    color: "#000",
                  }}
                  title={"View " + u2.name + "'s profile"}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                    onViewProfile && onViewProfile(u2.id);
                  }}
                >
                  {u2.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="who-name">
                  {isMe ? "Me (" + u2.name + ")" : u2.name}
                </span>
                {u2.notify && !isMe && (
                  <span
                    style={{
                      fontSize: 8,
                      fontFamily: "'DM Mono',monospace",
                      color: "#F5A623",
                    }}
                  >
                    NOTIF
                  </span>
                )}
                <div className={"mck" + (sel ? " mck-on" : "")}>
                  {sel ? "✓" : ""}
                </div>
              </div>
            );
          })}
          <button className="sh-close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── PROFILE PAGE ─────────────────────────────────────────────────────────────
function ProfilePage({
  user,
  curUser,
  concerts,
  pastShows,
  users,
  onBack,
  onFollowToggle,
  onOpenConcert,
  onViewProfile,
  onEdit,
  onGenreClick,
  onArtistClick,
}) {
  const [tab, setTab] = useState("upcoming");
  const [connModal, setConnModal] = useState(null); // null | "followers" | "following"
  const isSelf = user.id === curUser.id;
  const isFollowing = curUser.following.includes(user.id);
  const upcoming = concerts.filter((c) =>
    (c.attendees || []).includes(user.id),
  );
  const past = pastShows.filter((p) => user.past?.includes(p.id));
  const mutualUpcoming = upcoming.filter(
    (c) => (c.attendees || []).includes(curUser.id) && user.id !== curUser.id,
  );
  const followers = users.filter((u) => u.following.includes(user.id));
  const followingUsers = users.filter((u) => user.following.includes(u.id));
  const connList = connModal === "followers" ? followers : followingUsers;
  return (
    <div className="prof-page">
      <div className="prof-hdr">
        <button className="back-btn" onClick={onBack}>
          ←
        </button>
        <span className="prof-hdr-name">{user.name}</span>
        {!isSelf && (
          <button
            className={
              "prof-follow-btn " + (isFollowing ? "pf-following" : "pf-follow")
            }
            onClick={() => onFollowToggle(user.id)}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        )}
        {isSelf && (
          <button
            className="prof-follow-btn pf-follow"
            style={{
              background: "transparent",
              border: "1px solid rgba(245,166,35,.3)",
              color: "#F5A623",
            }}
            onClick={onEdit}
          >
            Edit Profile
          </button>
        )}
      </div>
      <div className="prof-hero">
        <div className="prof-top">
          <div className="prof-av" style={{ background: user.color }}>
            {user.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="prof-info">
            <div className="prof-name">{user.name}</div>
            <div className="prof-handle">@{user.handle}</div>
            <div className="prof-loc">📍 {user.location}</div>
          </div>
        </div>
        {user.bio && <div className="prof-bio">"{user.bio}"</div>}
        <div className="genre-row">
          {(user.genres || []).map((g) => (
            <span
              key={g}
              className="genre-tag"
              onClick={() => onGenreClick && onGenreClick(g)}
              title={"Explore " + g}
            >
              {g}
            </span>
          ))}
        </div>
        {(user.artists || []).length > 0 && (
          <div>
            <div className="prof-subsec">Favorite Artists</div>
            <div className="prof-artists">
              {user.artists.map((a) => (
                <span
                  key={a}
                  className="prof-art-pill"
                  onClick={() => onArtistClick && onArtistClick(a)}
                  title={"Explore " + a}
                >
                  ♪ {a}
                </span>
              ))}
            </div>
          </div>
        )}
        {(user.bucketList || []).length > 0 && (
          <div>
            <div className="prof-subsec">🎯 Bucket List</div>
            <div className="prof-artists">
              {user.bucketList.map((a) => (
                <span
                  key={a}
                  className="prof-bucket-pill"
                  onClick={() => onArtistClick && onArtistClick(a)}
                  title={"Explore " + a}
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="prof-stats">
          <div className="stat">
            <div className="stat-n">
              {past.length +
                (user.ratings ? Object.keys(user.ratings).length : 0)}
            </div>
            <div className="stat-l">Shows</div>
          </div>
          <div className="stat">
            <div className="stat-n">{upcoming.length}</div>
            <div className="stat-l">Upcoming</div>
          </div>
          <div
            className="stat stat-tap"
            onClick={() => setConnModal("followers")}
            title="View followers"
          >
            <div className="stat-n">{followers.length}</div>
            <div className="stat-l">Followers</div>
          </div>
          <div
            className="stat stat-tap"
            onClick={() => setConnModal("following")}
            title="View following"
          >
            <div className="stat-n">{followingUsers.length}</div>
            <div className="stat-l">Following</div>
          </div>
        </div>
        {user.social &&
          (user.social.instagram ||
            user.social.spotify ||
            user.social.soundcloud) && (
            <div className="prof-social-row" style={{ marginTop: 12 }}>
              {user.social.instagram && (
                <a
                  className="prof-social-link"
                  href={"https://instagram.com/" + user.social.instagram}
                  target="_blank"
                  rel="noreferrer"
                >
                  ig/{user.social.instagram}
                </a>
              )}
              {user.social.spotify && (
                <a
                  className="prof-social-link"
                  href={"https://open.spotify.com/user/" + user.social.spotify}
                  target="_blank"
                  rel="noreferrer"
                >
                  spotify
                </a>
              )}
              {user.social.soundcloud && (
                <a
                  className="prof-social-link"
                  href={"https://soundcloud.com/" + user.social.soundcloud}
                  target="_blank"
                  rel="noreferrer"
                >
                  sc/{user.social.soundcloud}
                </a>
              )}
            </div>
          )}
        {user.vibe && (
          <div style={{ marginTop: 8 }}>
            <span className="prof-vibe-badge">
              {user.vibe === "clubs"
                ? "🏠 clubs"
                : user.vibe === "festivals"
                  ? "🌅 festivals"
                  : "⚡ clubs + festivals"}
            </span>
          </div>
        )}
      </div>
      {mutualUpcoming.length > 0 && (
        <div style={{ padding: "12px 18px" }}>
          <div className="mutual-banner">
            <div className="mutual-title">
              🎟 You're both going to {mutualUpcoming.length} show
              {mutualUpcoming.length !== 1 ? "s" : ""}
            </div>
            {mutualUpcoming.map((c) => (
              <div key={c.id} className="mutual-show">
                <div className="mutual-dot" />
                <span>{c.artist}</span>
                <span
                  style={{
                    fontSize: 9,
                    fontFamily: "'DM Mono',monospace",
                    color: "#888",
                    marginLeft: "auto",
                  }}
                >
                  {fmt(c.date).mo} {fmt(c.date).day}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="prof-tabs">
        <button
          className={"prof-tab" + (tab === "upcoming" ? " on" : "")}
          onClick={() => setTab("upcoming")}
        >
          Upcoming ({upcoming.length})
        </button>
        <button
          className={"prof-tab" + (tab === "history" ? " on" : "")}
          onClick={() => setTab("history")}
        >
          History ({past.length})
        </button>
      </div>
      <div className="prof-content">
        {tab === "upcoming" &&
          (upcoming.length === 0 ? (
            <div className="empty">
              <div className="empty-i">🎵</div>
              <div className="empty-t">No Upcoming Shows</div>
              <div className="empty-s">
                {isSelf
                  ? "Add shows or scan Gmail."
                  : user.name + " hasn't tagged any upcoming shows yet."}
              </div>
            </div>
          ) : (
            <div className="grid">
              {upcoming.map((c) => (
                <CCard
                  key={c.id}
                  c={c}
                  users={users}
                  curUser={curUser}
                  onOpen={onOpenConcert}
                  onToggleGoing={() => {}}
                  onViewProfile={onViewProfile}
                />
              ))}
            </div>
          ))}
        {tab === "history" &&
          (past.length === 0 ? (
            <div className="empty">
              <div className="empty-i">📅</div>
              <div className="empty-t">No History Yet</div>
              <div className="empty-s">Past shows will appear here.</div>
            </div>
          ) : (
            <div>
              {past
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((p) => {
                  const d = fmt(p.date),
                    rating = user.ratings?.[p.id] || 0;
                  return (
                    <div key={p.id} className="past-item">
                      <div className="past-dbdg">
                        <div className="past-mo">{d.mo}</div>
                        <div className="past-dy">{d.day}</div>
                      </div>
                      <div className="past-info">
                        <div className="past-artist">{p.artist}</div>
                        <div className="past-venue">
                          {p.venue} · {p.city}
                        </div>
                      </div>
                      {rating > 0 && (
                        <div className="past-stars">{stars(rating)}</div>
                      )}
                    </div>
                  );
                })}
            </div>
          ))}
      </div>

      {/* ── FOLLOWERS / FOLLOWING MODAL ── */}
      {connModal && (
        <div className="mwrap" onClick={() => setConnModal(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-bar" style={{ background: "#F5A623" }} />
            <div className="sheet-handle" />
            <div className="sheet-body">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <div className="sh-artist" style={{ marginBottom: 0 }}>
                  {connModal === "followers" ? "Followers" : "Following"}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    style={{
                      padding: "5px 12px",
                      borderRadius: 14,
                      fontFamily: "'Syne',sans-serif",
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      cursor: "pointer",
                      border: "none",
                      transition: "all .15s",
                      background:
                        connModal === "followers"
                          ? "#F5A623"
                          : "rgba(245,166,35,.1)",
                      color: connModal === "followers" ? "#000" : "#F5A623",
                    }}
                    onClick={() => setConnModal("followers")}
                  >
                    Followers {followers.length}
                  </button>
                  <button
                    style={{
                      padding: "5px 12px",
                      borderRadius: 14,
                      fontFamily: "'Syne',sans-serif",
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      cursor: "pointer",
                      border: "none",
                      transition: "all .15s",
                      background:
                        connModal === "following"
                          ? "#F5A623"
                          : "rgba(245,166,35,.1)",
                      color: connModal === "following" ? "#000" : "#F5A623",
                    }}
                    onClick={() => setConnModal("following")}
                  >
                    Following {followingUsers.length}
                  </button>
                </div>
              </div>
              {connList.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "32px 0",
                    color: "#333",
                    fontFamily: "'DM Mono',monospace",
                    fontSize: 11,
                  }}
                >
                  {connModal === "followers"
                    ? "No followers yet"
                    : "Not following anyone yet"}
                </div>
              )}
              {connList.map((u2) => {
                const isF = curUser.following.includes(u2.id);
                const isSelf2 = u2.id === curUser.id;
                return (
                  <div
                    key={u2.id}
                    className="conn-item"
                    onClick={() => {
                      setConnModal(null);
                      onViewProfile && onViewProfile(u2.id);
                    }}
                  >
                    <div className="conn-av" style={{ background: u2.color }}>
                      {u2.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="conn-info">
                      <div className="conn-name">{u2.name}</div>
                      <div className="conn-sub">
                        @{u2.handle} · {u2.location}
                      </div>
                    </div>
                    {!isSelf2 && (
                      <button
                        className={"conn-flw " + (isF ? "cfy" : "cfn")}
                        onClick={(e) => {
                          e.stopPropagation();
                          onFollowToggle(u2.id);
                        }}
                      >
                        {isF ? "Following" : "Follow"}
                      </button>
                    )}
                  </div>
                );
              })}
              <button className="sh-close" onClick={() => setConnModal(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ARTIST SHEET ─────────────────────────────────────────────────────────────
// Shows upcoming concerts + streaming links for a given artist name
function ArtistSheet({ artistName, concerts, onClose, onOpenConcert }) {
  // fuzzy match: "Subtronics" matches "Subtronics b2b GRiZ"
  const slug = artistName.toLowerCase();
  const shows = concerts.filter(
    (c) =>
      c.artist.toLowerCase().includes(slug) ||
      slug.includes(c.artist.toLowerCase().split(" ")[0]),
  );
  return (
    <div className="mwrap" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-bar" style={{ background: "#F5A623" }} />
        <div className="sheet-handle" />
        <div className="sheet-body">
          <div className="sh-artist">{artistName}</div>
          <div className="sh-lbl nb">Upcoming Shows</div>
          {shows.length === 0 ? (
            <div className="art-no-shows">
              No upcoming shows in your feed for this artist.
              <br />
              Check the streaming links or resale sites below.
            </div>
          ) : (
            <div className="art-shows-list">
              {shows.map((c) => {
                const d = fmt(c.date),
                  u = getUrgency(c.date),
                  dy = daysUntil(c.date);
                return (
                  <div
                    key={c.id}
                    className="art-show-row"
                    style={{
                      borderColor:
                        u === "urgent"
                          ? "rgba(255,80,80,.3)"
                          : u === "soon"
                            ? "rgba(245,166,35,.25)"
                            : "#1e1e1e",
                    }}
                  >
                    <div className="art-show-info">
                      <div className="art-show-artist">{c.venue}</div>
                      <div className="art-show-venue">{c.city}</div>
                    </div>
                    <div className="art-show-date">
                      {d.mo} {d.day}
                    </div>
                    {primaryUrl(c) && (
                      <a
                        className="art-show-btn"
                        href={primaryUrl(c)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Tickets ↗
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div className="sh-lbl">Listen to {artistName}</div>
          <div className="sg">
            {STREAMS.map((s) => (
              <a
                key={s.name}
                className="sl"
                href={s.url(artistName)}
                target="_blank"
                rel="noreferrer"
                style={{ background: s.bg, border: "1px solid " + s.border }}
              >
                <div className="sdot" style={{ background: s.color }} />
                <span className="sn" style={{ color: s.color }}>
                  {s.name}
                </span>
                <span className="sa">↗</span>
              </a>
            ))}
          </div>
          <button className="sh-close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── GENRE PAGE ────────────────────────────────────────────────────────────────
function GenrePage({
  genre,
  users,
  curUser,
  concerts,
  onBack,
  onFollowToggle,
  onViewProfile,
  onArtistClick,
}) {
  const people = users.filter((u) => (u.genres || []).includes(genre));
  const shows = concerts.filter((c) => (c.genres || []).includes(genre));
  // all artists mentioned across shows + user favorites for this genre
  const artistSet = new Set();
  users.forEach((u) => {
    if ((u.genres || []).includes(genre)) {
      (u.artists || []).forEach((a) => artistSet.add(a));
      (u.bucketList || []).forEach((a) => artistSet.add(a));
    }
  });
  shows.forEach((c) => artistSet.add(c.artist));
  const relatedArtists = [...artistSet].filter(Boolean);

  return (
    <div className="genre-page">
      <div className="genre-hdr">
        <button className="back-btn" onClick={onBack}>
          ←
        </button>
        <span className="genre-hdr-name">{genre.toUpperCase()}</span>
      </div>
      <div className="genre-content">
        {/* Artists for this genre */}
        {relatedArtists.length > 0 && (
          <div className="genre-sec">
            <div className="genre-sec-hdr">Artists</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {relatedArtists.map((a) => (
                <button
                  key={a}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "6px 13px",
                    borderRadius: 14,
                    background: "#111",
                    border: "1px solid #222",
                    color: "#F0EDE8",
                    fontFamily: "'Syne',sans-serif",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all .15s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = "#888";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = "#222";
                  }}
                  onClick={() => onArtistClick(a)}
                >
                  ♪ {a}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming shows for this genre */}
        <div className="genre-sec">
          <div className="genre-sec-hdr">Upcoming Shows</div>
          {shows.length === 0 ? (
            <div className="empty" style={{ padding: "30px 0" }}>
              <div className="empty-i" style={{ fontSize: 24 }}>
                🎵
              </div>
              <div className="empty-s">
                No shows tagged with this genre yet.
              </div>
            </div>
          ) : (
            <div className="grid">
              {shows.map((c) => {
                const d = fmt(c.date),
                  u = getUrgency(c.date),
                  dy = daysUntil(c.date);
                const cc =
                  u === "urgent"
                    ? "card-u"
                    : u === "soon"
                      ? "card-s"
                      : "card-n";
                return (
                  <div
                    key={c.id}
                    className={"card " + cc}
                    onClick={() => onArtistClick(c.artist)}
                  >
                    <div
                      className="cbar"
                      style={{
                        background:
                          u === "urgent"
                            ? "#FF5050"
                            : u === "soon"
                              ? "#F5A623"
                              : "#2a2a2a",
                      }}
                    />
                    <div className="cbody">
                      {u === "urgent" && (
                        <div className="upill pill-u">
                          <div
                            className="pdot"
                            style={{ background: "#FF5050" }}
                          />
                          {dy === 0
                            ? "tonight"
                            : dy === 1
                              ? "tomorrow"
                              : dy + " days left"}
                        </div>
                      )}
                      {u === "soon" && (
                        <div className="upill pill-s">
                          <div
                            className="pdot"
                            style={{ background: "#F5A623" }}
                          />
                          {dy} days away
                        </div>
                      )}
                      <div className="drow">
                        <div className="dbdg">
                          <div className="dmo">{d.mo}</div>
                          <div className="ddy">{d.day}</div>
                          <div className="ddw">{d.dow}</div>
                        </div>
                        <div className="dart">{c.artist}</div>
                      </div>
                      <div className="dven">{c.venue}</div>
                      <div className="dcit">{c.city}</div>
                    </div>
                    <div className="cfoot">
                      <span
                        style={{
                          fontSize: 9,
                          fontFamily: "'DM Mono',monospace",
                          color: "#555",
                        }}
                      >
                        tap to see artist
                      </span>
                      {primaryUrl(c) && (
                        <a
                          href={primaryUrl(c)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            fontSize: 8,
                            fontFamily: "'DM Mono',monospace",
                            color: "#F5A623",
                            textDecoration: "none",
                          }}
                        >
                          tickets ↗
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* People into this genre */}
        <div className="genre-sec">
          <div className="genre-sec-hdr">People into {genre}</div>
          {people.length === 0 ? (
            <div className="empty" style={{ padding: "20px 0" }}>
              <div className="empty-s">
                No one in the app lists this genre yet.
              </div>
            </div>
          ) : (
            people.map((u2) => {
              const isF = curUser.following.includes(u2.id);
              const mc = concerts.filter(
                (c) =>
                  (c.attendees || []).includes(curUser.id) &&
                  (c.attendees || []).includes(u2.id),
              ).length;
              return (
                <div
                  key={u2.id}
                  className="user-card"
                  onClick={() => onViewProfile(u2.id)}
                >
                  <div className="uc-av" style={{ background: u2.color }}>
                    {u2.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="uc-info">
                    <div className="uc-name">{u2.name}</div>
                    <div className="uc-handle">
                      @{u2.handle} · {u2.location}
                    </div>
                    <div className="uc-genres">
                      {(u2.genres || []).map((g) => (
                        <span
                          key={g}
                          className="uc-genre"
                          style={{
                            background:
                              g === genre ? "rgba(245,166,35,.1)" : "",
                            borderColor:
                              g === genre ? "rgba(245,166,35,.3)" : "",
                            color: g === genre ? "#F5A623" : "",
                          }}
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                    {mc > 0 && (
                      <div className="uc-mutual">
                        🎟 {mc} mutual show{mc !== 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                  {u2.id !== curUser.id && (
                    <button
                      className={"uc-follow " + (isF ? "ucf-y" : "ucf-n")}
                      onClick={(e) => {
                        e.stopPropagation();
                        onFollowToggle(u2.id);
                      }}
                    >
                      {isF ? "Following" : "Follow"}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ── TAG SEARCH WIDGET (used for genres, artists, bucket list) ────────────────
function TagSearch({ value, onChange, suggestions, max, placeholder }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = suggestions
    .filter(
      (s) => s.toLowerCase().includes(q.toLowerCase()) && !value.includes(s),
    )
    .slice(0, 8);
  const add = (tag) => {
    if (value.length < max) onChange([...value, tag]);
    setQ("");
    setOpen(false);
  };
  const remove = (tag) => onChange(value.filter((v) => v !== tag));
  const handleKey = (e) => {
    if (e.key === "Enter" && q.trim()) {
      e.preventDefault();
      add(q.trim());
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  };
  return (
    <div>
      <div className="pill-row">
        {value.map((v) => (
          <div key={v} className="pill">
            {v}
            <button className="pill-x" onClick={() => remove(v)}>
              ×
            </button>
          </div>
        ))}
      </div>
      {value.length < max && (
        <div className="tag-search-wrap">
          <input
            className="tag-search-inp"
            placeholder={placeholder || "Type to search or add…"}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={handleKey}
          />
          {open && q && filtered.length > 0 && (
            <div className="tag-drop">
              {filtered.map((s) => (
                <div key={s} className="tag-opt" onMouseDown={() => add(s)}>
                  {s}
                  <span className="tag-opt-hint">tap to add</span>
                </div>
              ))}
              {!suggestions.includes(q.trim()) && q.trim().length > 1 && (
                <div
                  className="tag-opt"
                  style={{ color: "#F5A623" }}
                  onMouseDown={() => add(q.trim())}
                >
                  + Add "{q.trim()}"
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {value.length >= max && (
        <div
          style={{
            fontSize: 10,
            fontFamily: "'DM Mono',monospace",
            color: "#444",
            marginTop: 4,
          }}
        >
          Max {max} reached
        </div>
      )}
    </div>
  );
}

// ── EDIT PROFILE PAGE ─────────────────────────────────────────────────────────
function EditProfilePage({ user, onBack, onSave }) {
  const [draft, setDraft] = useState({
    name: user.name || "",
    handle: user.handle || "",
    location: user.location || "",
    bio: user.bio || "",
    color: user.color || "#F5A623",
    genres: [...(user.genres || [])],
    artists: [...(user.artists || [])],
    bucketList: [...(user.bucketList || [])],
    vibe: user.vibe || "both",
    totalShows: user.totalShows || "",
    social: { instagram: "", ...(user.social || {}) },
  });
  const set = (k, v) => setDraft((p) => ({ ...p, [k]: v }));
  const setSocial = (k, v) =>
    setDraft((p) => ({ ...p, social: { ...p.social, [k]: v } }));
  const bioLen = draft.bio.length;

  return (
    <div className="edit-page">
      <div className="edit-hdr">
        <button className="back-btn" onClick={onBack}>
          ←
        </button>
        <span className="edit-hdr-title">Edit Profile</span>
        <button className="edit-save" onClick={() => onSave(draft)}>
          Save
        </button>
      </div>

      {/* AVATAR */}
      <div className="edit-section">
        <div className="edit-sec-title">Avatar</div>
        <div className="av-preview" style={{ background: draft.color }}>
          {draft.name.slice(0, 2).toUpperCase() || "ME"}
        </div>
        <div className="av-grid">
          {AVATAR_COLORS.map((c) => (
            <div
              key={c}
              className={"av-swatch" + (draft.color === c ? " selected" : "")}
              style={{ background: c }}
              onClick={() => set("color", c)}
            />
          ))}
        </div>
      </div>

      {/* BASIC INFO */}
      <div className="edit-section" style={{ marginTop: 20 }}>
        <div className="edit-sec-title">Basic Info</div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <div className="edit-field" style={{ marginBottom: 0 }}>
            <div className="edit-lbl">Display Name</div>
            <input
              className="edit-inp"
              value={draft.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="edit-field" style={{ marginBottom: 0 }}>
            <div className="edit-lbl">Handle</div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "#0d0d0d",
                border: "1px solid #1e1e1e",
                borderRadius: 6,
                overflow: "hidden",
              }}
            >
              <span
                style={{
                  padding: "10px 8px 10px 12px",
                  fontFamily: "'DM Mono',monospace",
                  fontSize: 13,
                  color: "#444",
                  flexShrink: 0,
                }}
              >
                @
              </span>
              <input
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  color: "#F0EDE8",
                  padding: "10px 12px 10px 0",
                  fontFamily: "'Syne',sans-serif",
                  fontSize: 13,
                  outline: "none",
                }}
                value={draft.handle}
                onChange={(e) =>
                  set("handle", e.target.value.replace(/\s/g, ""))
                }
                placeholder="handle"
              />
            </div>
          </div>
        </div>
        <div className="edit-field">
          <div className="edit-lbl">Location</div>
          <input
            className="edit-inp"
            value={draft.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="City, State"
          />
        </div>
        <div className="edit-field">
          <div className="edit-lbl">
            Bio / Quote{" "}
            <span
              style={{
                color: "#333",
                textTransform: "none",
                fontWeight: 400,
                letterSpacing: 0,
              }}
            >
              (shown on your profile)
            </span>
          </div>
          <textarea
            className="edit-textarea"
            rows={3}
            maxLength={160}
            value={draft.bio}
            onChange={(e) => set("bio", e.target.value)}
            placeholder="What drives your concert obsession?"
          />
          <div className={"char-cnt" + (bioLen > 140 ? " warn" : "")}>
            {bioLen}/160
          </div>
        </div>
        <div className="edit-field">
          <div className="edit-lbl">
            Total Shows Attended{" "}
            <span
              style={{
                color: "#333",
                textTransform: "none",
                fontWeight: 400,
                letterSpacing: 0,
              }}
            >
              (lifetime, including pre-app)
            </span>
          </div>
          <input
            className="edit-inp"
            type="number"
            min="0"
            value={draft.totalShows}
            onChange={(e) => set("totalShows", e.target.value)}
            placeholder="e.g. 47"
          />
        </div>
      </div>

      {/* MUSIC TASTE */}
      <div className="edit-section" style={{ marginTop: 20 }}>
        <div className="edit-sec-title">Music Taste</div>

        <div className="edit-field">
          <div className="edit-lbl">Genres</div>
          <TagSearch
            value={draft.genres}
            onChange={(v) => set("genres", v)}
            suggestions={GENRES}
            max={8}
            placeholder="House, Techno, Bass…"
          />
        </div>

        <div className="edit-field">
          <div className="edit-lbl">
            Favorite Artists{" "}
            <span
              style={{
                color: "#333",
                textTransform: "none",
                fontWeight: 400,
                letterSpacing: 0,
              }}
            >
              (up to 5)
            </span>
          </div>
          <TagSearch
            value={draft.artists}
            onChange={(v) => set("artists", v)}
            suggestions={ARTIST_SUGG}
            max={5}
            placeholder="Search artists…"
          />
        </div>

        <div className="edit-field">
          <div className="edit-lbl">
            🎯 Bucket List{" "}
            <span
              style={{
                color: "#333",
                textTransform: "none",
                fontWeight: 400,
                letterSpacing: 0,
              }}
            >
              (artists you want to see live — up to 5)
            </span>
          </div>
          <TagSearch
            value={draft.bucketList}
            onChange={(v) => set("bucketList", v)}
            suggestions={ARTIST_SUGG}
            max={5}
            placeholder="Who do you need to see before you die?"
          />
        </div>

        <div className="edit-field">
          <div className="edit-lbl">Show Vibe</div>
          <div className="vibe-row">
            {[
              ["clubs", "🏠 Clubs"],
              ["both", "⚡ Both"],
              ["festivals", "🌅 Festivals"],
            ].map(([v, l]) => (
              <button
                key={v}
                className={"vibe-btn" + (draft.vibe === v ? " on" : "")}
                onClick={() => set("vibe", v)}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SOCIAL */}
      <div
        className="edit-section"
        style={{ marginTop: 20, paddingBottom: 20 }}
      >
        <div className="edit-sec-title">Social Links</div>
        <div className="edit-lbl" style={{ marginBottom: 6 }}>
          Instagram
        </div>
        <div className="social-row" style={{ marginBottom: 10 }}>
          <span className="social-prefix">instagram.com/</span>
          <input
            className="social-inp"
            value={draft.social.instagram}
            onChange={(e) => setSocial("instagram", e.target.value)}
            placeholder="yourhandle"
          />
        </div>
        <div className="edit-lbl" style={{ marginBottom: 6 }}>
          Spotify
        </div>
        <div className="social-row" style={{ marginBottom: 10 }}>
          <span className="social-prefix">spotify.com/user/</span>
          <input
            className="social-inp"
            value={draft.social.spotify}
            onChange={(e) => setSocial("spotify", e.target.value)}
            placeholder="your-user-id"
          />
        </div>
        <div className="edit-lbl" style={{ marginBottom: 6 }}>
          SoundCloud
        </div>
        <div className="social-row">
          <span className="social-prefix">soundcloud.com/</span>
          <input
            className="social-inp"
            value={draft.social.soundcloud}
            onChange={(e) => setSocial("soundcloud", e.target.value)}
            placeholder="yourhandle"
          />
        </div>
      </div>
    </div>
  );
}

// ── SEARCH / DISCOVER PAGE ────────────────────────────────────────────────────
function SearchPage({
  users,
  curUser,
  concerts,
  onFollowToggle,
  onViewProfile,
  onGenreClick,
}) {
  const [q, setQ] = useState("");
  const [genreFilter, setGenreFilter] = useState(null);
  const others = users.filter((u) => u.id !== curUser.id);
  const results = others.filter((u) => {
    const matchQ =
      !q ||
      u.name.toLowerCase().includes(q.toLowerCase()) ||
      u.handle.toLowerCase().includes(q.toLowerCase()) ||
      u.location.toLowerCase().includes(q.toLowerCase());
    const matchG = !genreFilter || (u.genres || []).includes(genreFilter);
    return matchQ && matchG;
  });
  const mutualCount = (u2) =>
    concerts.filter(
      (c) =>
        (c.attendees || []).includes(curUser.id) &&
        (c.attendees || []).includes(u2.id),
    ).length;
  return (
    <div className="search-page">
      <div className="pg-head">
        <div className="pg-title">Discover</div>
      </div>
      <div className="search-box">
        <span className="search-icon">⌕</span>
        <input
          className="search-inp"
          placeholder="Search by name, handle, or city…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {q && (
          <button
            style={{
              background: "none",
              border: "none",
              color: "#555",
              cursor: "pointer",
              fontSize: 14,
            }}
            onClick={() => setQ("")}
          >
            ×
          </button>
        )}
      </div>
      <div className="search-tags">
        {GENRES.slice(0, 8).map((g) => (
          <button
            key={g}
            className={"search-tag" + (genreFilter === g ? " on" : "")}
            onClick={() => setGenreFilter(genreFilter === g ? null : g)}
          >
            {g}
          </button>
        ))}
      </div>
      {results.length === 0 && (
        <div className="empty">
          <div className="empty-i">🔍</div>
          <div className="empty-t">No Results</div>
          <div className="empty-s">Try a different name or genre filter.</div>
        </div>
      )}
      {results.map((u2) => {
        const isF = curUser.following.includes(u2.id);
        const mc = mutualCount(u2);
        return (
          <div
            key={u2.id}
            className="user-card"
            onClick={() => onViewProfile(u2.id)}
          >
            <div className="uc-av" style={{ background: u2.color }}>
              {u2.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="uc-info">
              <div className="uc-name">{u2.name}</div>
              <div className="uc-handle">
                @{u2.handle} · {u2.location}
              </div>
              <div className="uc-genres">
                {(u2.genres || []).map((g) => (
                  <span
                    key={g}
                    className="uc-genre"
                    onClick={(e) => {
                      e.stopPropagation();
                      onGenreClick && onGenreClick(g);
                    }}
                    title={"Explore " + g}
                  >
                    {g}
                  </span>
                ))}
              </div>
              {mc > 0 && (
                <div className="uc-mutual">
                  🎟 {mc} mutual show{mc !== 1 ? "s" : ""}
                </div>
              )}
            </div>
            <button
              className={"uc-follow " + (isF ? "ucf-y" : "ucf-n")}
              onClick={(e) => {
                e.stopPropagation();
                onFollowToggle(u2.id);
              }}
            >
              {isF ? "Following" : "Follow"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ── LOGIN PAGE ───────────────────────────────────────────────────────────────
function LoginPage({ onBack }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: "https://encorefriends.com/app.html" },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        background: "#070707",
        textAlign: "center",
      }}
    >
      <div style={{ marginBottom: 40 }}>
        <div
          style={{
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: 48,
            letterSpacing: 8,
            color: "#F5A623",
            marginBottom: 6,
          }}
        >
          ENCORE
        </div>
        <div
          style={{
            fontFamily: "'DM Mono',monospace",
            fontSize: 10,
            letterSpacing: 4,
            color: "#444",
            textTransform: "uppercase",
          }}
        >
          Concert Tracker
        </div>
      </div>
      <div
        style={{
          background: "#111",
          border: "1px solid #1e1e1e",
          borderRadius: 10,
          padding: "40px 32px",
          maxWidth: 360,
          width: "100%",
        }}
      >
        <div
          style={{
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: 26,
            letterSpacing: 2,
            marginBottom: 8,
          }}
        >
          Welcome Back
        </div>
        <div
          style={{
            fontFamily: "'DM Mono',monospace",
            fontSize: 11,
            color: "#555",
            marginBottom: 32,
            lineHeight: 1.6,
          }}
        >
          Sign in to track shows, follow friends, and never miss a concert.
        </div>
        <button
          onClick={signInWithGoogle}
          disabled={loading}
          style={{
            width: "100%",
            padding: "13px 20px",
            background: "#fff",
            color: "#000",
            border: "none",
            borderRadius: 6,
            fontFamily: "'Syne',sans-serif",
            fontSize: 14,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            opacity: loading ? 0.6 : 1,
            marginBottom: 16,
            transition: "all .15s",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {loading ? "Signing in…" : "Continue with Google"}
        </button>
        {error && (
          <div
            style={{
              fontSize: 11,
              color: "#FF5555",
              fontFamily: "'DM Mono',monospace",
              marginBottom: 12,
            }}
          >
            {error}
          </div>
        )}
        <div
          style={{
            borderTop: "1px solid #1a1a1a",
            paddingTop: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {onBack && (
            <button
              onClick={onBack}
              style={{
                background: "none",
                border: "none",
                fontSize: 11,
                fontFamily: "'DM Mono',monospace",
                color: "#666",
                cursor: "pointer",
                letterSpacing: 0.5,
              }}
            >
              ← Keep browsing as guest
            </button>
          )}
          <a
            href="index.html"
            style={{
              fontSize: 11,
              fontFamily: "'DM Mono',monospace",
              color: "#444",
              textDecoration: "none",
              letterSpacing: 0.5,
            }}
          >
            ← Back to encorefriends.com
          </a>
        </div>
      </div>
      <div
        style={{
          marginTop: 24,
          fontSize: 10,
          fontFamily: "'DM Mono',monospace",
          color: "#2a2a2a",
          letterSpacing: 0.5,
        }}
      >
        By signing in you agree to our terms. We only read ticket confirmation
        emails.
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
// ── ARTIST SEARCH WIDGET (Spotify-backed, mirrors TagSearch markup) ──────────
// Same look/CSS as TagSearch, but suggestions come from the Netlify Spotify
// proxy instead of a static list. Stores plain artist-name strings.
function ArtistSearch({ value, onChange, max, placeholder }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(
          "/.netlify/functions/spotify-artist-search?q=" + encodeURIComponent(term),
        );
        const d = await r.json();
        setResults((d.artists || []).map((a) => a.name));
      } catch (e) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const add = (name) => {
    if (value.length < max && !value.includes(name)) onChange([...value, name]);
    setQ("");
    setResults([]);
    setOpen(false);
  };
  const remove = (name) => onChange(value.filter((v) => v !== name));
  const handleKey = (e) => {
    if (e.key === "Enter" && q.trim()) {
      e.preventDefault();
      add(q.trim());
    }
    if (e.key === "Escape") setOpen(false);
  };
  const shown = results.filter((n) => !value.includes(n)).slice(0, 8);

  return (
    <div>
      <div className="pill-row">
        {value.map((v) => (
          <div key={v} className="pill">
            {v}
            <button className="pill-x" onClick={() => remove(v)}>
              ×
            </button>
          </div>
        ))}
      </div>
      {value.length < max && (
        <div className="tag-search-wrap">
          <input
            className="tag-search-inp"
            placeholder={placeholder || "Search artists…"}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={handleKey}
          />
          {open && q.trim().length >= 2 && (
            <div className="tag-drop">
              {loading && shown.length === 0 && (
                <div className="tag-opt" style={{ color: "#555" }}>
                  Searching…
                </div>
              )}
              {shown.map((name) => (
                <div
                  key={name}
                  className="tag-opt"
                  onMouseDown={() => add(name)}
                >
                  {name}
                  <span className="tag-opt-hint">tap to add</span>
                </div>
              ))}
              {!loading && q.trim().length > 1 && !shown.includes(q.trim()) && (
                <div
                  className="tag-opt"
                  style={{ color: "#F5A623" }}
                  onMouseDown={() => add(q.trim())}
                >
                  + Add "{q.trim()}"
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {value.length >= max && (
        <div
          style={{
            fontSize: 10,
            fontFamily: "'DM Mono',monospace",
            color: "#444",
            marginTop: 4,
          }}
        >
          Max {max} reached
        </div>
      )}
    </div>
  );
}

// ── ONBOARDING WALKTHROUGH ───────────────────────────────────────────────────
// Shown once, right after a new user signs in, before they reach the app.
// name + handle are required; location, genres, artists are optional.
// Writes the real row to `profiles` and hands it back via onComplete.
function Onboarding({ session, profile, onComplete }) {
  const meta = (session.user && session.user.user_metadata) || {};
  const p = profile || {};
  const [step, setStep] = useState(1);
  const [name, setName] = useState(p.name || meta.full_name || meta.name || "");
  const [handle, setHandle] = useState(
    (p.handle || meta.full_name || meta.name || "")
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 20),
  );
  const [handleStatus, setHandleStatus] = useState(""); // "", checking, taken, ok, short
  const [location, setLocation] = useState(p.location || "");
  const [email, setEmail] = useState((session.user && session.user.email) || "");
  const [phone, setPhone] = useState("");
  const [genres, setGenres] = useState(p.genres || []);
  const [artists, setArtists] = useState(p.artists || []);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const [color] = useState(() => {
    const palette = [
      "#E85D3A", "#9B6BF5", "#2ECC71", "#3498DB",
      "#F39C12", "#E91E8C", "#1ABC9C", "#F5A623",
    ];
    return p.color || palette[Math.floor(Math.random() * palette.length)];
  });

  // Live handle availability check (debounced)
  useEffect(() => {
    const h = handle.trim();
    if (h.length === 0) {
      setHandleStatus("");
      return;
    }
    if (h.length < 2) {
      setHandleStatus("short");
      return;
    }
    setHandleStatus("checking");
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("handle", h)
        .maybeSingle();
      if (data && data.id !== session.user.id) setHandleStatus("taken");
      else setHandleStatus("ok");
    }, 400);
    return () => clearTimeout(t);
  }, [handle]);

  const step1Valid =
    name.trim().length > 0 && handle.trim().length >= 2 && handleStatus === "ok";

  const finish = async () => {
    setSaving(true);
    setErr(null);
    const row = {
      id: session.user.id,
      name: name.trim(),
      handle: handle.trim(),
      color,
      location: location.trim(),
      bio: p.bio || "",
      genres,
      artists,
      vibe: p.vibe || "both",
      total_shows: p.total_shows || 0,
      social: p.social || {},
      onboarded: true,
    };
    const { data, error } = await supabase
      .from("profiles")
      .upsert(row, { onConflict: "id" })
      .select()
      .single();
    if (error) {
      setErr(error.message);
      setSaving(false);
      return;
    }
    // Contact info lives in a separate, owner-only table — NOT in the public
    // profiles table (which is world-readable). Used for friend notifications.
    if (email.trim() || phone.trim()) {
      await supabase
        .from("user_contacts")
        .upsert(
          { id: session.user.id, email: email.trim(), phone: phone.trim() },
          { onConflict: "id" },
        );
    }
    onComplete(data);
  };

  const lbl = {
    fontFamily: "'DM Mono',monospace",
    fontSize: 10,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: "#F5A623",
    marginBottom: 8,
    display: "block",
  };
  const inp = {
    width: "100%",
    background: "#0c0c0c",
    border: "1px solid #1e1e1e",
    borderRadius: 6,
    color: "#f0ede8",
    fontFamily: "'Syne',sans-serif",
    fontSize: 15,
    padding: "12px 13px",
    outline: "none",
    boxSizing: "border-box",
  };
  const help = {
    fontFamily: "'DM Mono',monospace",
    fontSize: 10,
    color: "#555",
    marginTop: 6,
    lineHeight: 1.5,
  };

  const handleMsg = {
    checking: { t: "Checking…", c: "#555" },
    taken: { t: "That handle's taken — try another.", c: "#ff6b6b" },
    ok: { t: "Available", c: "#2ECC71" },
    short: { t: "A little longer, please.", c: "#555" },
    "": { t: "", c: "#555" },
  }[handleStatus];

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        background: "#070707",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 26 }}>
        <div
          style={{
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: 40,
            letterSpacing: 7,
            color: "#F5A623",
          }}
        >
          ENCORE
        </div>
        <div
          style={{
            fontFamily: "'DM Mono',monospace",
            fontSize: 10,
            letterSpacing: 3,
            color: "#444",
            textTransform: "uppercase",
          }}
        >
          Let's build your profile
        </div>
      </div>

      <div
        style={{
          background: "#111",
          border: "1px solid #1e1e1e",
          borderRadius: 10,
          padding: "30px 26px",
          maxWidth: 400,
          width: "100%",
        }}
      >
        {/* step dots */}
        <div
          style={{
            display: "flex",
            gap: 6,
            justifyContent: "center",
            marginBottom: 26,
          }}
        >
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              style={{
                width: n === step ? 22 : 7,
                height: 7,
                borderRadius: 4,
                background: n === step ? "#F5A623" : n < step ? "#7a5a1e" : "#262626",
                transition: "all .2s",
              }}
            />
          ))}
        </div>

        {/* STEP 1 — name + handle */}
        {step === 1 && (
          <div>
            <div
              style={{
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: 24,
                letterSpacing: 1,
                marginBottom: 4,
              }}
            >
              The basics
            </div>
            <div style={{ ...help, marginTop: 0, marginBottom: 22 }}>
              Just a name and a handle. You can change these later.
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>Your name</label>
              <input
                style={inp}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Kyle Weber"
                maxLength={40}
              />
            </div>

            <div>
              <label style={lbl}>Handle</label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 13,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#555",
                    fontFamily: "'Syne',sans-serif",
                    fontSize: 15,
                  }}
                >
                  @
                </span>
                <input
                  style={{ ...inp, paddingLeft: 26 }}
                  value={handle}
                  onChange={(e) =>
                    setHandle(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9_]/g, "")
                        .slice(0, 20),
                    )
                  }
                  placeholder="kyleweber"
                />
              </div>
              {handleMsg.t && (
                <div style={{ ...help, color: handleMsg.c }}>{handleMsg.t}</div>
              )}
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!step1Valid}
              style={{
                width: "100%",
                marginTop: 28,
                padding: "13px",
                background: step1Valid ? "#F5A623" : "#2a2a2a",
                color: step1Valid ? "#000" : "#555",
                border: "none",
                borderRadius: 6,
                fontFamily: "'Syne',sans-serif",
                fontSize: 14,
                fontWeight: 700,
                cursor: step1Valid ? "pointer" : "not-allowed",
              }}
            >
              Continue
            </button>
          </div>
        )}

        {/* STEP 2 — location */}
        {step === 2 && (
          <div>
            <div
              style={{
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: 24,
                letterSpacing: 1,
                marginBottom: 4,
              }}
            >
              Location & notifications
            </div>
            <div style={{ ...help, marginTop: 0, marginBottom: 22 }}>
              All optional. Email and phone are how friends can ping you when
              they grab tickets — kept private, never shown on your profile.
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={lbl}>City</label>
              <input
                style={inp}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Brooklyn, NY"
                maxLength={60}
              />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={lbl}>Email for notifications</label>
              <input
                style={inp}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                maxLength={120}
              />
            </div>
            <div>
              <label style={lbl}>Phone (for texts)</label>
              <input
                style={inp}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 123 4567"
                maxLength={30}
              />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
              <button onClick={() => setStep(1)} style={btnBack}>
                Back
              </button>
              <button onClick={() => setStep(3)} style={btnNext}>
                Continue
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — taste */}
        {step === 3 && (
          <div>
            <div
              style={{
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: 24,
                letterSpacing: 1,
                marginBottom: 4,
              }}
            >
              Your music taste
            </div>
            <div style={{ ...help, marginTop: 0, marginBottom: 22 }}>
              Optional — pick a few so friends can see what you're into.
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>Genres</label>
              <TagSearch
                value={genres}
                onChange={setGenres}
                suggestions={GENRES}
                max={8}
                placeholder="House, Techno, Bass…"
              />
            </div>

            <div>
              <label style={lbl}>Favorite artists</label>
              <ArtistSearch
                value={artists}
                onChange={setArtists}
                max={5}
                placeholder="Search artists…"
              />
            </div>

            {err && (
              <div style={{ ...help, color: "#ff6b6b", marginTop: 16 }}>
                Couldn't save: {err}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
              <button
                onClick={() => setStep(2)}
                disabled={saving}
                style={btnBack}
              >
                Back
              </button>
              <button onClick={finish} disabled={saving} style={btnNext}>
                {saving ? "Saving…" : "Finish"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const btnBack = {
  flex: "0 0 auto",
  padding: "13px 18px",
  background: "transparent",
  color: "#777",
  border: "1px solid #262626",
  borderRadius: 6,
  fontFamily: "'Syne',sans-serif",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};
const btnNext = {
  flex: 1,
  padding: "13px",
  background: "#F5A623",
  color: "#000",
  border: "none",
  borderRadius: 6,
  fontFamily: "'Syne',sans-serif",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [dbConcerts, setDbConcerts] = useState([]);
  const [profileChecked, setProfileChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load real profile from Supabase when session is ready
  useEffect(() => {
    if (!session) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setProfile(data);
        setProfileChecked(true);
      });
  }, [session]);

  // Load (or reload) the user's concerts from Supabase. Called on session load
  // and again after every scan, so the dashboard always reflects what's saved —
  // even when a re-scan finds only duplicates and returns nothing new.
  const reloadConcerts = async () => {
    const { data } = await supabase
      .from("concerts")
      .select("*, concert_attendees(user_id)")
      .order("date", { ascending: true });
    if (data)
      setDbConcerts(
        data.map((c) => ({
          ...c,
          attendees: (c.concert_attendees || []).map((a) => a.user_id),
        })),
      );
    setConcertsLoaded(true);
  };

  useEffect(() => {
    reloadConcerts();
  }, [session]);

  const [users, setUsers] = useState([]);
  const [myFollowing, setMyFollowing] = useState([]);

  // Load the people directory (all public profiles) + the follow graph, and
  // build each user's `following` list from the follows table.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: profs }, { data: fols }] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("follows").select("follower_id, following_id"),
      ]);
      if (cancelled || !profs) return;
      const followMap = {};
      (fols || []).forEach((f) => {
        if (!followMap[f.follower_id]) followMap[f.follower_id] = [];
        followMap[f.follower_id].push(f.following_id);
      });
      setUsers(
        profs.map((pr) => ({
          id: pr.id,
          name: pr.name || "User",
          handle: pr.handle || "",
          color: pr.color || "#F5A623",
          location: pr.location || "",
          bio: pr.bio || "",
          genres: pr.genres || [],
          artists: pr.artists || [],
          bucketList: pr.bucket_list || [],
          vibe: pr.vibe || "both",
          totalShows: pr.total_shows || 0,
          social: pr.social || {},
          following: followMap[pr.id] || [],
          past: [],
          ratings: {},
        })),
      );
      if (session?.user?.id) setMyFollowing(followMap[session.user.id] || []);
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);
  const [view, setView] = useState("feed"); // "feed" | "search" | "profile" | "edit" | "genre"
  const [genreView, setGenreView] = useState(null); // current genre string when view==="genre"
  const [prevView, setPrevView] = useState("feed"); // where to go back from genre page
  const [artistModal, setArtistModal] = useState(null); // artist name string for sheet overlay
  const [profileId, setProfileId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [showAuth, setShowAuth] = useState(false); // guest -> sign-in screen
  const [detail, setDetail] = useState(null);
  const [showAddC, setShowAddC] = useState(false);
  const [showAddF, setShowAddF] = useState(false); // desktop add friend
  const [newFN, setNewFN] = useState("");
  const [nc, setNc] = useState({
    artist: "",
    venue: "",
    city: "",
    date: "",
    source: "Ticketmaster",
  });
  const [scanning, setScanning] = useState(false);
  const [scanSt, setScanSt] = useState("");
  const [scanPr, setScanPr] = useState(0);
  const [notif, setNotif] = useState(null);
  const [errMsg, setErrMsg] = useState(null);
  const [pastShows] = useState([]);
  const [liveConcerts, setLiveConcerts] = useState([]);
  const [concertsLoaded, setConcertsLoaded] = useState(false);

  // Replace with real DB concerts when they load (could be empty for new users)
  useEffect(() => {
    if (!concertsLoaded) return;
    setLiveConcerts(dbConcerts);
  }, [dbConcerts, concertsLoaded]);

  // ── EARLY AUTH RETURNS (after all hooks) ──
  if (authLoading || (session && !profileChecked))
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#070707",
        }}
      >
        <div
          style={{
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: 32,
            letterSpacing: 6,
            color: "#F5A623",
            opacity: 0.4,
          }}
        >
          ENCORE
        </div>
      </div>
    );
  // Guests can browse the app read-only. They reach the sign-in screen by
  // tapping any "Sign up" CTA (which sets showAuth).
  if (!session && showAuth)
    return <LoginPage onBack={() => setShowAuth(false)} />;

  // Members must finish onboarding first. (A DB trigger auto-creates a profile
  // with a generated handle on signup, so we gate on the explicit `onboarded`
  // flag rather than an empty handle.)
  if (session && (!profile || !profile.onboarded))
    return (
      <Onboarding
        session={session}
        profile={profile}
        onComplete={(p) => setProfile(p)}
      />
    );

  // Build curUser from real Supabase profile, fallback to demo while loading
  const curUser = profile
    ? {
        id: session.user.id, // real UUID
        name: profile.name || session.user.user_metadata?.full_name || "User",
        handle: profile.handle || "",
        color: profile.color || "#F5A623",
        location: profile.location || "",
        bio: profile.bio || "",
        genres: profile.genres || [],
        artists: profile.artists || [],
        bucketList: profile.bucket_list || [],
        vibe: profile.vibe || "both",
        totalShows: profile.total_shows || 0,
        social: profile.social || {},
        following: myFollowing,
        upcoming: [],
        past: [],
        ratings: {},
      }
    : {
        id: null,
        name: "Guest",
        handle: "",
        color: "#3a3a3a",
        location: "",
        bio: "",
        genres: [],
        artists: [],
        bucketList: [],
        vibe: "both",
        totalShows: 0,
        social: {},
        following: [],
        upcoming: [],
        past: [],
        ratings: {},
      };
  const isGuest = !session;
  // Any write action by a guest opens the sign-in screen instead.
  const requireAuth = () => {
    if (isGuest) {
      setShowAuth(true);
      return false;
    }
    return true;
  };
  const toast = (m, e) => {
    if (e) {
      setErrMsg(m);
      setTimeout(() => setErrMsg(null), 6000);
    } else {
      setNotif(m);
      setTimeout(() => setNotif(null), 3500);
    }
  };

  const deleteConcert = async (cid) => {
    if (!requireAuth()) return;
    if (!confirm("Remove this show from your account? This can't be undone."))
      return;
    if (session?.user?.id) {
      await supabase.from("concert_attendees").delete().eq("concert_id", cid);
      await supabase
        .from("concerts")
        .delete()
        .eq("id", cid)
        .eq("owner_id", session.user.id);
    }
    setLiveConcerts((p) => p.filter((c) => c.id !== cid));
    toast("Show removed.");
  };

  const toggleAttendee = async (cid, uid) => {
    if (!requireAuth()) return;
    const c = liveConcerts.find((c) => c.id === cid);
    if (!c) return;
    const adding = !(c.attendees || []).includes(uid);
    setLiveConcerts((p) =>
      p.map((c) =>
        c.id !== cid
          ? c
          : {
              ...c,
              attendees: adding
                ? [...(c.attendees || []), uid]
                : (c.attendees || []).filter((i) => i !== uid),
            },
      ),
    );
    // RLS lets a user change only their OWN attendance, so persist just that.
    if (session?.user?.id && uid === session.user.id) {
      if (adding)
        await supabase
          .from("concert_attendees")
          .insert({ concert_id: cid, user_id: uid });
      else
        await supabase
          .from("concert_attendees")
          .delete()
          .eq("concert_id", cid)
          .eq("user_id", uid);
    }
    const u2 = users.find((u) => u.id === uid);
    if (adding && u2?.notify && uid !== curUser.id)
      toast(u2.name + " tagged on " + c.artist + " — notified!");
  };
  const toggleGoing = (cid) => toggleAttendee(cid, curUser.id);
  const toggleFollow = async (uid) => {
    if (!requireAuth()) return;
    if (uid === curUser.id) return;
    const u2 = users.find((u) => u.id === uid);
    const isF = myFollowing.includes(uid);
    setMyFollowing((p) => (isF ? p.filter((i) => i !== uid) : [...p, uid]));
    setUsers((p) =>
      p.map((u) =>
        u.id === curUser.id
          ? {
              ...u,
              following: isF
                ? u.following.filter((i) => i !== uid)
                : [...u.following, uid],
            }
          : u,
      ),
    );
    toast(
      isF
        ? "Unfollowed " + (u2?.name || "")
        : "Now following " + (u2?.name || "") + "!",
    );
    if (isF)
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", curUser.id)
        .eq("following_id", uid);
    else
      await supabase
        .from("follows")
        .insert({ follower_id: curUser.id, following_id: uid });
  };
  const toggleNotif = (e, uid) => {
    e?.stopPropagation();
    const u2 = users.find((u) => u.id === uid);
    setUsers((p) =>
      p.map((u) => (u.id === uid ? { ...u, notify: !u.notify } : u)),
    );
    if (!u2.notify) toast("Notifications on for " + u2.name);
  };
  const viewProfile = (uid) => {
    setProfileId(uid);
    setView("profile");
  };
  const saveProfile = async (draft) => {
    if (!requireAuth()) return;
    // Save to Supabase
    if (session?.user?.id) {
      await supabase
        .from("profiles")
        .update({
          name: draft.name,
          handle: draft.handle,
          color: draft.color,
          location: draft.location,
          bio: draft.bio,
          genres: draft.genres,
          artists: draft.artists,
          bucket_list: draft.bucketList,
          vibe: draft.vibe,
          total_shows: draft.totalShows ? parseInt(draft.totalShows) : 0,
          social: draft.social,
        })
        .eq("id", session.user.id);
      setProfile((p) => ({
        ...p,
        ...draft,
        bucket_list: draft.bucketList,
        total_shows: draft.totalShows,
      }));
    }
    setView("profile");
  };
  const openGenre = (genre) => {
    setPrevView(view);
    setGenreView(genre);
    setView("genre");
  };
  const openArtist = (name) => setArtistModal(name);
  const closeGenre = () => {
    setView(prevView);
    setGenreView(null);
  };

  const scanGmail = async () => {
    if (!requireAuth()) return;
    if (GOOGLE_CLIENT_ID === "YOUR_GOOGLE_CLIENT_ID_HERE") {
      toast(
        "Add your Google Client ID to app.js to enable Gmail scanning.",
        true,
      );
      return;
    }
    setScanning(true);
    setScanPr(0);
    try {
      const userId = session?.user?.id || null;
      const r = await doScan(setScanSt, setScanPr, userId);
      setScanPr(100);
      setScanSt(
        r.length
          ? `Found ${r.length} show${r.length !== 1 ? "s" : ""}!`
          : "No new shows found.",
      );
      if (userId) {
        // Source of truth: re-pull from the DB so the dashboard shows every
        // saved show — including ones a re-scan skipped as duplicates.
        await reloadConcerts();
      } else if (r.length) {
        // Not signed in (legacy path): merge into the local view only.
        const ex = new Set(liveConcerts.map((c) => c.artist + c.date));
        setLiveConcerts((p) => [
          ...p,
          ...r.filter((x) => !ex.has(x.artist + x.date)),
        ]);
      }
    } catch (e) {
      setScanPr(100);
      setScanSt("Scan failed.");
      toast("Error: " + (e.message || e), true);
    } finally {
      setTimeout(() => setScanning(false), 900);
    }
  };

  const clearMyShows = async () => {
    if (!requireAuth()) return;
    if (!window.confirm("Delete ALL your shows? This can't be undone.")) return;
    if (session?.user?.id) {
      const { data: mine } = await supabase
        .from("concerts")
        .select("id")
        .eq("owner_id", session.user.id);
      const ids = (mine || []).map((r) => r.id);
      if (ids.length) {
        await supabase.from("concert_attendees").delete().in("concert_id", ids);
        // .select() returns the rows actually deleted, so we can verify it
        // worked rather than assume it did (a blocked delete returns none).
        const { data: del, error } = await supabase
          .from("concerts")
          .delete()
          .eq("owner_id", session.user.id)
          .select("id");
        if (error) {
          toast("Couldn't delete shows: " + error.message, true);
          return;
        }
        if (!del || del.length === 0) {
          toast(
            "Delete was blocked — add a delete policy in Supabase (RLS).",
            true,
          );
          return;
        }
      }
    }
    setLiveConcerts([]);
    setDbConcerts([]);
    toast("All shows cleared.");
  };

  const addManually = async () => {
    if (!requireAuth()) return;
    if (!nc.artist.trim() || !nc.date) return;
    if (!session?.user?.id) return;
    const { data, error } = await supabase
      .from("concerts")
      .insert({
        owner_id: session.user.id,
        artist: nc.artist.trim(),
        venue: nc.venue.trim(),
        city: nc.city.trim(),
        date: nc.date,
        end_date: nc.date,
        source: nc.source || "Other",
        ticket_url: "",
        is_festival: false,
        genres: [],
      })
      .select()
      .single();
    if (error) {
      toast("Couldn't add: " + error.message, true);
      return;
    }
    if (data)
      await supabase
        .from("concert_attendees")
        .insert({ concert_id: data.id, user_id: session.user.id });
    await reloadConcerts();
    setNc({
      artist: "",
      venue: "",
      city: "",
      date: "",
      source: "Ticketmaster",
    });
    setShowAddC(false);
    toast(nc.artist.trim() + " added!");
  };

  // ── DERIVED ──
  const followedIds = [curUser.id, ...curUser.following];
  const filtered =
    filter === "all"
      ? liveConcerts
      : filter === "mine"
        ? liveConcerts.filter((c) => (c.attendees || []).includes(curUser.id))
        : filter === "following"
          ? liveConcerts.filter((c) =>
              (c.attendees || []).some((a) => myFollowing.includes(a)),
            )
          : liveConcerts.filter((c) => (c.attendees || []).includes(filter));
  const grouped = [...filtered]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .reduce((acc, c) => {
      const d = new Date(c.date + "T12:00:00"),
        k = d.getFullYear() + "-" + d.getMonth(),
        l = MONTHS[d.getMonth()] + " " + d.getFullYear();
      if (!acc[k]) acc[k] = { l, items: [] };
      acc[k].items.push(c);
      return acc;
    }, {});
  const followedFriends = users.filter(
    (u) => u.id !== curUser.id && curUser.following.includes(u.id),
  );
  const profileUser =
    profileId != null ? users.find((u) => u.id === profileId) : null;

  return (
    <>
      {/* Styles loaded from css/app.css */}
      <div className="app">
        {/* ── HEADER ── */}
        <header className="hdr">
          <div className="hdr-r1">
            <div onClick={() => setView("feed")} style={{ cursor: "pointer" }}>
              <div className="logo">ENCORE</div>
              <div className="logo-sub">CONCERT TRACKER</div>
            </div>
            <div className="hdr-icons">
              <button
                className={"icon-btn" + (view === "search" ? " active" : "")}
                onClick={() => setView(view === "search" ? "feed" : "search")}
                title="Discover people"
              >
                ⌕
              </button>
              {isGuest ? (
                <button
                  className="btn-sm btn-amber"
                  onClick={() => setShowAuth(true)}
                >
                  Sign up
                </button>
              ) : (
                <>
                  <div
                    className="my-avatar"
                    style={{ background: curUser.color }}
                    onClick={() => viewProfile(curUser.id)}
                    title="My profile"
                  >
                    {curUser.name.slice(0, 2).toUpperCase()}
                  </div>
                  <button
                    onClick={() => supabase.auth.signOut()}
                    style={{
                      background: "transparent",
                      border: "1px solid #1e1e1e",
                      color: "#555",
                      padding: "6px 10px",
                      fontFamily: "'Syne',sans-serif",
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      cursor: "pointer",
                      borderRadius: 3,
                    }}
                  >
                    Out
                  </button>
                </>
              )}
            </div>
          </div>
          {view === "feed" && (
            <div className="hdr-r2">
              {isGuest ? (
                <button
                  className="btn-sm btn-amber"
                  onClick={() => setShowAuth(true)}
                >
                  Sign up to track your shows →
                </button>
              ) : (
                <>
                  <button
                    className="btn-sm btn-amber"
                    onClick={() => setShowAddC(true)}
                  >
                    + Add
                  </button>
                  <button
                    className="btn-sm btn-primary"
                    onClick={scanGmail}
                    disabled={scanning}
                  >
                    {scanning ? "Scanning…" : "⟲ Scan Gmail"}
                  </button>
                  <button
                    className="btn-sm"
                    onClick={clearMyShows}
                    disabled={scanning}
                    title="Delete all your shows"
                  >
                    ⌫ Clear
                  </button>
                </>
              )}
            </div>
          )}
        </header>

        {/* ── MOBILE FILTER BAR (feed only) ── */}
        {view === "feed" && (
          <div className="fbar">
            <button
              className={"chip" + (filter === "all" ? " active" : "")}
              onClick={() => setFilter("all")}
            >
              All <span className="chip-cnt">{liveConcerts.length}</span>
            </button>
            <button
              className={"chip" + (filter === "mine" ? " active" : "")}
              onClick={() => setFilter("mine")}
            >
              Mine{" "}
              <span className="chip-cnt">
                {
                  liveConcerts.filter((c) =>
                    (c.attendees || []).includes(curUser.id),
                  ).length
                }
              </span>
            </button>
            {!isGuest && myFollowing.length > 0 && (
              <button
                className={"chip" + (filter === "following" ? " active" : "")}
                onClick={() => setFilter("following")}
              >
                Following{" "}
                <span className="chip-cnt">
                  {
                    liveConcerts.filter((c) =>
                      (c.attendees || []).some((a) => myFollowing.includes(a)),
                    ).length
                  }
                </span>
              </button>
            )}
            <div className="chip-div" />
            {followedFriends.map((f) => (
              <button
                key={f.id}
                className={"chip" + (filter === f.id ? " active" : "")}
                onClick={() => setFilter(filter === f.id ? "all" : f.id)}
              >
                <div className="chip-av" style={{ background: f.color }}>
                  {f.name.slice(0, 2).toUpperCase()}
                </div>
                {f.name}
                <span className="chip-cnt">
                  {
                    liveConcerts.filter((c) =>
                      (c.attendees || []).includes(f.id),
                    ).length
                  }
                </span>
              </button>
            ))}
            <button
              className="chip"
              style={{ borderStyle: "dashed", color: "#555" }}
              onClick={() => setView("search")}
            >
              + Follow
            </button>
          </div>
        )}

        <div className="body">
          {/* ── DESKTOP SIDEBAR ── */}
          {view === "feed" && (
            <aside className="sidebar">
              <div className="sb-lbl">Browse</div>
              <button
                className={"sb-btn" + (filter === "all" ? " active" : "")}
                onClick={() => setFilter("all")}
              >
                All Shows <span className="sb-cnt">{liveConcerts.length}</span>
              </button>
              <button
                className={"sb-btn" + (filter === "mine" ? " active" : "")}
                onClick={() => setFilter("mine")}
              >
                My Tickets{" "}
                <span className="sb-cnt">
                  {
                    liveConcerts.filter((c) =>
                      (c.attendees || []).includes(curUser.id),
                    ).length
                  }
                </span>
              </button>
              <div className="sb-lbl">Following</div>
              {followedFriends.map((f) => (
                <div key={f.id} className="sb-frow">
                  <button
                    className={"sb-btn" + (filter === f.id ? " active" : "")}
                    style={{ flex: 1 }}
                    onClick={() => setFilter(filter === f.id ? "all" : f.id)}
                  >
                    <div className="sb-fav" style={{ background: f.color }}>
                      {f.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="sb-fname">{f.name}</span>
                    <span className="sb-fcnt">
                      {
                        liveConcerts.filter((c) =>
                          (c.attendees || []).includes(f.id),
                        ).length
                      }
                    </span>
                  </button>
                  <button
                    className={"ntgl " + (f.notify ? "on" : "off")}
                    onClick={(e) => toggleNotif(e, f.id)}
                  />
                  <button
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#444",
                      fontSize: 11,
                      padding: "3px 2px",
                    }}
                    onClick={() => viewProfile(f.id)}
                    title={"View " + f.name + "'s profile"}
                  >
                    ↗
                  </button>
                </div>
              ))}
              <button className="sb-add" onClick={() => setView("search")}>
                ⌕ Discover &amp; follow
              </button>
            </aside>
          )}

          {/* ── MAIN VIEWS ── */}
          {view === "search" && (
            <SearchPage
              users={users}
              curUser={curUser}
              concerts={liveConcerts}
              onFollowToggle={toggleFollow}
              onViewProfile={viewProfile}
              onGenreClick={openGenre}
            />
          )}
          {view === "profile" && profileUser && (
            <ProfilePage
              user={profileUser}
              curUser={curUser}
              concerts={liveConcerts}
              pastShows={pastShows}
              users={users}
              onBack={() => setView("feed")}
              onFollowToggle={toggleFollow}
              onOpenConcert={setDetail}
              onViewProfile={viewProfile}
              onEdit={() => setView("edit")}
              onGenreClick={openGenre}
              onArtistClick={openArtist}
            />
          )}
          {view === "edit" && (
            <EditProfilePage
              user={curUser}
              onBack={() => setView("profile")}
              onSave={saveProfile}
            />
          )}
          {view === "genre" && genreView && (
            <GenrePage
              genre={genreView}
              users={users}
              curUser={curUser}
              concerts={liveConcerts}
              onBack={closeGenre}
              onFollowToggle={toggleFollow}
              onViewProfile={viewProfile}
              onArtistClick={openArtist}
            />
          )}
          {view === "feed" && (
            <main className="main">
              {notif && <div className="toast-ok">🔔 {notif}</div>}
              {errMsg && <div className="toast-err">⚠ {errMsg}</div>}
              <div className="pg-head">
                <div className="pg-title">
                  {filter === "all"
                    ? "All Shows"
                    : filter === "mine"
                      ? "My Tickets"
                      : (
                          (users.find((u) => u.id === filter)?.name || "") +
                          "'s Shows"
                        ).toUpperCase()}
                </div>
                <div className="pg-cnt">{filtered.length} shows</div>
              </div>
              {liveConcerts.length > 0 && (
                <div className="legend">
                  <div className="leg">
                    <div className="led" style={{ background: "#FF5050" }} />
                    Within 2 weeks
                  </div>
                  <div className="leg">
                    <div className="led" style={{ background: "#F5A623" }} />
                    Within 30 days
                  </div>
                  <div className="leg">
                    <div className="led" style={{ background: "#2a2a2a" }} />
                    Further out
                  </div>
                </div>
              )}
              {liveConcerts.length === 0 ? (
                <div className="empty">
                  <div className="empty-i">🎵</div>
                  <div className="empty-t">No Shows Yet</div>
                  <div className="empty-s">
                    Scan Gmail or add a show manually to get started.
                  </div>
                </div>
              ) : filtered.length === 0 ? (
                <div className="empty">
                  <div className="empty-i">🎫</div>
                  <div className="empty-t">No Shows Here</div>
                </div>
              ) : (
                Object.values(grouped).map(({ l, items }) => (
                  <div key={l} className="sec">
                    <div className="sec-hdr">{l}</div>
                    <div className="grid">
                      {items.map((c) => (
                        <CCard
                          key={c.id}
                          c={c}
                          users={users}
                          curUser={curUser}
                          onOpen={setDetail}
                          onToggleGoing={toggleGoing}
                          onViewProfile={viewProfile}
                          onDelete={deleteConcert}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </main>
          )}
        </div>
      </div>

      {/* SCAN OVERLAY */}
      {scanning && (
        <div className="scov">
          <div className="scbx">
            <div className="sct pulse">SCANNING</div>
            <div className="scs">{scanSt}</div>
            <div className="pb">
              <div className="pf" style={{ width: scanPr + "%" }} />
            </div>
            <div className="scn">Reading Gmail…</div>
          </div>
        </div>
      )}

      {/* ADD CONCERT SHEET */}
      {showAddC && (
        <div className="mwrap" onClick={() => setShowAddC(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-bar" style={{ background: "#F5A623" }} />
            <div className="sheet-handle" />
            <div className="sheet-body">
              <div className="sh-artist">Add a Show</div>
              <div className="sh-venue" style={{ marginBottom: 16 }}>
                Manually add a concert the scanner missed
              </div>
              <div className="form-row">
                <div className="form-lbl">Artist *</div>
                <input
                  className="form-inp"
                  placeholder="e.g. Deadmau5"
                  value={nc.artist}
                  onChange={(e) =>
                    setNc((p) => ({ ...p, artist: e.target.value }))
                  }
                />
              </div>
              <div className="form-row">
                <div className="form-lbl">Venue</div>
                <input
                  className="form-inp"
                  placeholder="e.g. XS Nightclub"
                  value={nc.venue}
                  onChange={(e) =>
                    setNc((p) => ({ ...p, venue: e.target.value }))
                  }
                />
              </div>
              <div className="form-grid">
                <div className="form-row" style={{ marginBottom: 0 }}>
                  <div className="form-lbl">City</div>
                  <input
                    className="form-inp"
                    placeholder="Las Vegas, NV"
                    value={nc.city}
                    onChange={(e) =>
                      setNc((p) => ({ ...p, city: e.target.value }))
                    }
                  />
                </div>
                <div className="form-row" style={{ marginBottom: 0 }}>
                  <div className="form-lbl">Date *</div>
                  <input
                    className="form-inp"
                    type="date"
                    value={nc.date}
                    onChange={(e) =>
                      setNc((p) => ({ ...p, date: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="form-row" style={{ marginTop: 11 }}>
                <div className="form-lbl">Source</div>
                <select
                  className="form-sel"
                  value={nc.source}
                  onChange={(e) =>
                    setNc((p) => ({ ...p, source: e.target.value }))
                  }
                >
                  {SOURCES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <button className="form-btn" onClick={addManually}>
                Add Concert
              </button>
              <button className="sh-close" onClick={() => setShowAddC(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONCERT DETAIL */}
      {detail && (
        <CDetail
          c={detail}
          users={users}
          curUser={curUser}
          onClose={() => setDetail(null)}
          onToggleAttendee={toggleAttendee}
          onViewProfile={viewProfile}
        />
      )}
      {artistModal && (
        <ArtistSheet
          artistName={artistModal}
          concerts={liveConcerts}
          onClose={() => setArtistModal(null)}
          onOpenConcert={(c) => {
            setArtistModal(null);
            setDetail(c);
          }}
        />
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
