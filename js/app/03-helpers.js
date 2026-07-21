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
// Short, human relative time for shows that have already happened.
// short relative time for a timestamp (notifications)
const timeAgo = (ts) => {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  return Math.floor(s / 86400) + "d ago";
};
const agoLabel = (dy) => {
  const a = Math.abs(dy);
  if (a <= 1) return "yesterday";
  if (a < 7) return a + " days ago";
  if (a < 14) return "last week";
  if (a < 31) return Math.round(a / 7) + " weeks ago";
  if (a < 365) return Math.round(a / 30) + " months ago";
  return Math.round(a / 365) + " yr ago";
};
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

// ── CONCERT CARD ─────────────────────────────────────────────────────────────