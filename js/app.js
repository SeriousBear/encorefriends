/* ============================================================
   ENCORE — App Logic
   app.js  (React + Babel via CDN)
   ============================================================ */

const { useState, useEffect, useRef } = React;
const enc = encodeURIComponent;

// ── CONFIGg ──────────────────────────────────────────────────────────────────
const ANTHROPIC_API_KEY = "YOUR_ANTHROPIC_API_KEY_HERE";
const SUPABASE_URL = "https://zfcehcqklrrfncihjwkk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_LhcC2ZeRoWsD3eAGNIUfwg_iSJyJqip";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Web-push: paste the PUBLIC VAPID key here (the same one goes in Netlify env).
// Generate once with:  npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY =
  "BJKV6Lf06d8lTNYYOsFZxsenCLtkt3R45S1ZjFBXAvOsNYln8gg-n2C5gjmL9DaMS95klHtkIK0qA17eA49DAog";

// VAPID keys are URL-safe base64; the browser's subscribe() wants a Uint8Array.
// ── PLATFORM DETECTION (push support differs wildly by platform) ─────────────
// iOS only delivers web push to apps installed on the home screen, and every
// iOS browser is WebKit underneath — so Chrome/Firefox/etc on iOS can't do it.
const isIOS = () =>
  typeof navigator !== "undefined" &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

// Running from the home screen (installed) rather than a browser tab?
const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.navigator.standalone === true ||
    (window.matchMedia &&
      window.matchMedia("(display-mode: standalone)").matches));

// On iOS, only Safari reliably offers "Add to Home Screen".
const isIOSNonSafari = () =>
  isIOS() && /CriOS|FxiOS|EdgiOS|OPiOS/i.test(navigator.userAgent);

// Brave ships with web push disabled by default — worth saying so explicitly.
async function isBrave() {
  try {
    return !!(navigator.brave && (await navigator.brave.isBrave()));
  } catch (e) {
    return false;
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

// Email-forwarding auto-tracking. Keep FORWARDING_ENABLED off until the
// inbound-email backend (Cloudflare Email Routing / receiver function) is live —
// otherwise users forward mail to an address nothing is listening on.
const FORWARDING_ENABLED = true;
const FORWARD_DOMAIN = "encorefriends.com";

// Social logins shown on the sign-in screen, in order.
// ONLY list a provider after it's fully configured in
// Supabase → Authentication → Providers — otherwise the button is a dead end.
//   "apple"    → needs a paid Apple Developer account ($99/yr)
//   "facebook" → needs a Meta app in Live mode
const AUTH_PROVIDERS = ["google"];

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
// ── GENRE TAXONOMY ───────────────────────────────────────────────────────────
// Parent genre -> subgenres. Matching happens at the family level: a genre
// page shows anything tagged with the genre itself, its subgenres, or its
// parent. Keep this in sync with netlify/functions/genre-taxonomy.mjs (the
// parser + backfill use the same list).
const GENRE_TAXONOMY = {
  "Techno": [
    "Minimal Techno", "Melodic Techno", "Hard Techno", "Industrial Techno", "Acid Techno", "Dub Techno",
    "Detroit Techno", "Peak Time Techno", "Hypnotic Techno", "Hard Groove", "Schranz", "Broken Techno",
  ],
  "House": [
    "Deep House", "Tech House", "Progressive House", "Acid House", "Afro House", "Bass House",
    "Chicago House", "Disco House", "Electro House", "French House", "Funky House", "Future House",
    "Ghetto House", "Jackin House", "Latin House", "Lo-Fi House", "Melodic House", "Microhouse",
    "Organic House", "Piano House", "Soulful House", "Tribal House", "Tropical House", "Vocal House",
  ],
  "Trance": [
    "Psytrance", "Progressive Trance", "Uplifting Trance", "Vocal Trance", "Goa Trance", "Hard Trance",
    "Tech Trance", "Full-On Psytrance", "Dark Psytrance", "Forest Psytrance", "Hi-Tech Psytrance", "Acid Trance",
  ],
  "Drum & Bass": [
    "Jungle", "Liquid DnB", "Neurofunk", "Jump Up", "Techstep", "Darkstep",
    "Halftime", "Minimal DnB", "Ragga Jungle", "Drumstep", "Rollers", "Dancefloor DnB",
  ],
  "Bass": [
    "Dubstep", "Riddim", "Brostep", "Melodic Dubstep", "Deep Dubstep", "Tearout",
    "Deathstep", "Colour Bass", "Future Bass", "Glitch Hop", "Wave", "Trap (EDM)",
    "Hybrid Trap", "Moombahton", "Jersey Club", "Baltimore Club", "Footwork", "Juke",
    "Midtempo",
  ],
  "UK Garage": [
    "2-Step", "Speed Garage", "Bassline", "Future Garage", "UK Funky", "Garage House",
    "Breakbeat", "Breaks", "Big Beat", "Nu Skool Breaks",
  ],
  "Hard Dance": [
    "Hardstyle", "Rawstyle", "Euphoric Hardstyle", "Hardcore", "Gabber", "Happy Hardcore",
    "Frenchcore", "Uptempo", "Speedcore", "Terrorcore", "Hard House", "Donk",
    "Jumpstyle", "Makina",
  ],
  "EDM": [
    "Big Room", "Mainstage", "Complextro", "Melbourne Bounce", "Slap House", "Future Rave",
  ],
  "Electronica": [
    "Ambient", "IDM", "Downtempo", "Trip-Hop", "Glitch", "Drone",
    "Electro", "Chillwave", "Chillout", "Psybient", "Psydub", "Dark Ambient",
    "Berlin School", "Leftfield", "Synthwave", "Vaporwave", "Future Funk", "New Age",
    "Lo-Fi",
  ],
  "Disco & Funk": [
    "Disco", "Nu-Disco", "Italo Disco", "Funk", "Boogie", "French Touch",
    "Hi-NRG",
  ],
  "Hip-Hop": [
    "Rap", "Trap", "Drill", "UK Drill", "Boom Bap", "Cloud Rap",
    "Grime", "Phonk", "Rage", "Plugg", "Emo Rap", "Conscious Hip-Hop",
    "Gangsta Rap", "G-Funk", "Crunk", "Hyphy", "Horrorcore", "Underground Hip-Hop",
    "East Coast Hip-Hop", "West Coast Hip-Hop", "Southern Hip-Hop", "Abstract Hip-Hop",
  ],
  "R&B & Soul": [
    "R&B", "Soul", "Neo-Soul", "Motown", "Alternative R&B", "Contemporary R&B",
    "Quiet Storm", "New Jack Swing", "Gospel", "Doo-Wop",
  ],
  "Pop": [
    "Indie Pop", "Synth-Pop", "Dream Pop", "Hyperpop", "Electropop", "Art Pop",
    "Bedroom Pop", "Dance Pop", "Power Pop", "Chamber Pop", "Baroque Pop", "Bubblegum Pop",
    "K-Pop", "J-Pop", "City Pop", "Mandopop", "Cantopop", "Europop",
  ],
  "Rock": [
    "Classic Rock", "Indie Rock", "Alternative Rock", "Psychedelic Rock", "Garage Rock", "Math Rock",
    "Post-Rock", "Prog Rock", "Stoner Rock", "Grunge", "Shoegaze", "Hard Rock",
    "Blues Rock", "Glam Rock", "Surf Rock", "Southern Rock", "Krautrock", "New Wave",
    "Noise Rock", "Art Rock", "Britpop", "Rockabilly",
  ],
  "Punk": [
    "Post-Punk", "Hardcore Punk", "Pop Punk", "Emo", "Midwest Emo", "Screamo",
    "Post-Hardcore", "Ska Punk", "Crust Punk", "Skate Punk", "Street Punk", "Oi!",
    "Egg Punk", "Folk Punk",
  ],
  "Metal": [
    "Heavy Metal", "Death Metal", "Black Metal", "Metalcore", "Deathcore", "Thrash Metal",
    "Doom Metal", "Sludge Metal", "Power Metal", "Progressive Metal", "Nu Metal", "Djent",
    "Grindcore", "Folk Metal", "Symphonic Metal", "Industrial Metal", "Melodic Death Metal",
  ],
  "Jazz": [
    "Smooth Jazz", "Bebop", "Jazz Fusion", "Swing", "Big Band", "Free Jazz",
    "Hard Bop", "Cool Jazz", "Latin Jazz", "Nu Jazz", "Jazz-Funk", "Spiritual Jazz",
    "Vocal Jazz", "Gypsy Jazz",
  ],
  "Blues": [
    "Soul Blues", "Delta Blues", "Chicago Blues", "Electric Blues", "Country Blues", "Jump Blues",
  ],
  "Folk & Country": [
    "Folk", "Indie Folk", "Singer-Songwriter", "Country", "Americana", "Bluegrass",
    "Folk Rock", "Alt-Country", "Outlaw Country", "Country Pop", "Honky Tonk", "Celtic",
    "Freak Folk", "Roots",
  ],
  "Latin": [
    "Reggaeton", "Latin Trap", "Latin Pop", "Salsa", "Cumbia", "Bachata",
    "Merengue", "Bossa Nova", "Samba", "Flamenco", "Regional Mexican", "Corridos Tumbados",
    "Banda", "Norte\u00f1o", "Mariachi", "Dembow", "Baile Funk", "Tango",
    "Tejano",
  ],
  "Caribbean": [
    "Reggae", "Dancehall", "Dub", "Ska", "Rocksteady", "Soca",
    "Calypso", "Zouk", "Kompa", "Lovers Rock",
  ],
  "African": [
    "Afrobeats", "Afrobeat", "Amapiano", "Highlife", "Gqom", "Kwaito",
    "3-Step", "Alt\u00e9", "Bongo Flava", "Soukous",
  ],
  "Classical": [
    "Opera", "Contemporary Classical", "Film Score", "Soundtrack", "Baroque", "Chamber Music",
    "Neoclassical", "Minimalism", "Choral",
  ],
  "Experimental": [
    "Noise", "Industrial", "EBM", "Darkwave", "Coldwave", "Minimal Wave",
    "Witch House", "Deconstructed Club", "Avant-Garde", "Power Electronics", "Musique Concr\u00e8te", "Sound Collage",
    "No Wave",
  ],
  "World": [
    "Spoken Word", "Klezmer", "Balkan", "Bhangra", "Bollywood", "Arabic Pop",
    "Turkish Psych", "Fado",
  ],
};
const GENRE_PARENTS = Object.keys(GENRE_TAXONOMY);
const GENRE_PARENT_OF = {};
GENRE_PARENTS.forEach((p) =>
  GENRE_TAXONOMY[p].forEach((s) => {
    GENRE_PARENT_OF[s] = p;
  }),
);
// Flat list (parents first) — used everywhere the old GENRES array was.
const GENRES = [
  ...GENRE_PARENTS,
  ...GENRE_PARENTS.flatMap((p) => GENRE_TAXONOMY[p]),
];
// All names a genre page covers: itself + its subgenres + its parent.
const genreFamily = (g) => {
  const fam = new Set([g]);
  (GENRE_TAXONOMY[g] || []).forEach((s) => fam.add(s));
  if (GENRE_PARENT_OF[g]) fam.add(GENRE_PARENT_OF[g]);
  return fam;
};
const genreHit = (tags, g) => {
  const fam = genreFamily(g);
  return (tags || []).some((t) => fam.has(t));
};
// Match strength between two users. Strongest signal first: shows you're both
// going to, shows you both attended, shared favorite artists, shared genres.
const matchInfo = (me, u2, concerts) => {
  if (!me || !u2 || u2.id === me.id || !me.id) return { score: 0, line: null };
  const both = (c) =>
    (c.attendees || []).includes(me.id) && (c.attendees || []).includes(u2.id);
  const up = concerts.filter((c) => both(c) && daysUntil(c.date) >= 0);
  const past = concerts.filter((c) => both(c) && daysUntil(c.date) < 0);
  const arts = (me.artists || []).filter((a) =>
    (u2.artists || []).includes(a),
  );
  const gens = (me.genres || []).filter((g) => (u2.genres || []).includes(g));
  const score =
    up.length * 10 + past.length * 5 + arts.length * 2 + gens.length;
  let line = null;
  if (up.length)
    line =
      up.length === 1
        ? "🎟 You're both going to " + up[0].artist
        : "🎟 " + up.length + " upcoming shows together";
  else if (past.length)
    line =
      "🤝 You were both at " +
      past[0].artist +
      (past.length > 1 ? " +" + (past.length - 1) + " more" : "");
  else if (arts.length) line = "♪ Both into " + arts.slice(0, 2).join(", ");
  else if (gens.length) line = "◈ Shared: " + gens.slice(0, 3).join(", ");
  return { score, line };
};

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
function CCard({
  c,
  users,
  curUser,
  onOpen,
  onToggleGoing,
  onViewProfile,
  onDelete,
  onGenreClick,
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
          {c.hidden && c.owner_id === curUser.id && (
            <div
              title="Going quietly — only you can see this show"
              style={{
                padding: "2px 7px",
                background: "rgba(255,255,255,.05)",
                border: "1px solid #2a2a2a",
                borderRadius: 3,
                fontSize: 9,
                lineHeight: 1.4,
              }}
            >
              🤫
            </div>
          )}
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
        {u === "past" && (
          <div
            className="upill"
            style={{
              background: "rgba(255,255,255,0.05)",
              color: "#888",
              border: "1px solid #2a2a2a",
            }}
          >
            <div className="pdot" style={{ background: "#666" }} />
            {agoLabel(dy)}
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
        {(c.genres || []).length > 0 && (
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 7 }}
          >
            {(c.genres || []).slice(0, 3).map((g) => (
              <span
                key={g}
                className="uc-genre"
                title={"Explore " + g}
                onClick={(e) => {
                  e.stopPropagation();
                  onGenreClick && onGenreClick(g);
                }}
              >
                {g}
              </span>
            ))}
          </div>
        )}
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

// ── SHARE PICKER (send a show to a friend as a message) ──────────────────────
function SharePicker({ c, users, curUser, onClose, onSend }) {
  const friends = users.filter(
    (u) =>
      u.id !== curUser.id &&
      ((curUser.following || []).includes(u.id) ||
        (u.following || []).includes(curUser.id)),
  );
  return (
    <div className="mwrap" onClick={onClose} style={{ zIndex: 700 }}>
      <div
        className="sheet"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 420 }}
      >
        <div className="sheet-bar" style={{ background: "#F5A623" }} />
        <div style={{ padding: "10px 18px 22px" }}>
          <div
            style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: 22,
              letterSpacing: 1,
              marginBottom: 2,
            }}
          >
            Share {c.artist}
          </div>
          <div
            style={{
              fontFamily: "'DM Mono',monospace",
              fontSize: 10,
              color: "#666",
              marginBottom: 12,
            }}
          >
            Sends the show as a message.
          </div>
          {friends.length === 0 ? (
            <div
              style={{
                color: "#666",
                fontFamily: "'Syne',sans-serif",
                fontSize: 13,
                padding: "18px 0",
                textAlign: "center",
              }}
            >
              Follow some people first — then you can share shows with them.
            </div>
          ) : (
            friends.map((u2) => (
              <div
                key={u2.id}
                onClick={() => onSend(u2.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 6px",
                  borderBottom: "1px solid #141414",
                  cursor: "pointer",
                  borderRadius: 6,
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "rgba(245,166,35,.05)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "";
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    background: u2.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#000",
                  }}
                >
                  {u2.name.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 14 }}>
                  {u2.name}
                </div>
                <div
                  style={{
                    marginLeft: "auto",
                    fontFamily: "'DM Mono',monospace",
                    fontSize: 10,
                    color: "#F5A623",
                  }}
                >
                  Send ▸
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── INBOX (Messages + Activity tabs) ─────────────────────────────────────────
function InboxSheet({
  curUser,
  users,
  msgs,
  notifs,
  notifMsg,
  tab,
  setTab,
  activeThread,
  setActiveThread,
  actFilter,
  setActFilter,
  onSend,
  onClose,
  onViewProfile,
  onReportBug,
  onMarkActivityRead,
  myBlocks,
  onBlock,
  crews,
  activeCrew,
  setActiveCrew,
  onLeaveCrew,
  onCrewRead,
}) {
  const [draft, setDraft] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const [crewMsgs, setCrewMsgs] = useState([]);
  const listRef = useRef(null);

  // Load + live-subscribe the open crew's messages; mark the crew read.
  useEffect(() => {
    if (!activeCrew) {
      setCrewMsgs([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("thread_messages")
        .select("*")
        .eq("thread_id", activeCrew)
        .order("created_at", { ascending: true })
        .limit(200);
      if (!cancelled && data) setCrewMsgs(data);
    })();
    onCrewRead && onCrewRead(activeCrew);
    let cch;
    if (typeof supabase.channel === "function") {
      cch = supabase
        .channel("crew-" + activeCrew)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "thread_messages",
            filter: "thread_id=eq." + activeCrew,
          },
          (payload) => {
            if (payload.new) {
              setCrewMsgs((p) =>
                p.some((m) => m.id === payload.new.id)
                  ? p
                  : [...p, payload.new],
              );
              onCrewRead && onCrewRead(activeCrew);
            }
          },
        )
        .subscribe();
    }
    return () => {
      cancelled = true;
      if (cch) supabase.removeChannel(cch);
    };
  }, [activeCrew]);

  const sendCrew = async () => {
    const t = draft.trim();
    if (!t || !activeCrew) return;
    setDraft("");
    const { data, error } = await supabase
      .from("thread_messages")
      .insert({ thread_id: activeCrew, sender_id: curUser.id, body: t })
      .select()
      .single();
    if (!error && data)
      setCrewMsgs((p) =>
        p.some((m) => m.id === data.id) ? p : [...p, data],
      );
  };
  useEffect(() => {
    if (tab === "activity") onMarkActivityRead();
  }, [tab]);
  useEffect(() => {
    if (listRef.current)
      listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [msgs.length, activeThread, crewMsgs.length, activeCrew]);

  const vMsgs = msgs.filter((m) => {
    const o = m.sender_id === curUser.id ? m.recipient_id : m.sender_id;
    return !(myBlocks || []).includes(o);
  });
  const unreadM = vMsgs.filter(
    (m) => m.recipient_id === curUser.id && !m.read,
  ).length;
  const unreadN = notifs.filter((n) => !n.read).length;

  // Threads grouped by the other participant, newest first.
  const threads = {};
  vMsgs.forEach((m) => {
    const other = m.sender_id === curUser.id ? m.recipient_id : m.sender_id;
    if (!threads[other]) threads[other] = { last: m, unread: 0 };
    else if (
      new Date(m.created_at) > new Date(threads[other].last.created_at)
    )
      threads[other].last = m;
    if (m.recipient_id === curUser.id && !m.read) threads[other].unread++;
  });
  const myCrews = (crews || []).filter((t) =>
    (t.thread_members || []).some((m) => m.user_id === curUser.id),
  );
  const crewUnread = (t) => {
    const me = (t.thread_members || []).find(
      (m) => m.user_id === curUser.id,
    );
    return !!(
      me &&
      t.last_message_at &&
      new Date(t.last_message_at) > new Date(me.last_read_at)
    );
  };
  const crewUnreadTotal = myCrews.filter(crewUnread).length;
  const threadIds = Object.keys(threads).sort(
    (a, b) =>
      new Date(threads[b].last.created_at) -
      new Date(threads[a].last.created_at),
  );

  const isConnected = (id) => {
    const u2 = users.find((u) => u.id === id);
    return (
      (curUser.following || []).includes(id) ||
      (u2 && (u2.following || []).includes(curUser.id))
    );
  };
  // A request = a stranger wrote first and you've never replied.
  const isRequest = (id) =>
    !isConnected(id) &&
    !vMsgs.some((m) => m.sender_id === curUser.id && m.recipient_id === id);

  const threadMsgs = activeThread
    ? vMsgs
        .filter(
          (m) =>
            m.sender_id === activeThread || m.recipient_id === activeThread,
        )
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    : [];
  const other = activeThread
    ? users.find((u) => u.id === activeThread)
    : null;

  const send = async () => {
    const t = draft.trim();
    if (!t || !activeThread) return;
    setDraft("");
    await onSend(activeThread, t, null);
  };

  const filteredNotifs = notifs.filter((n) =>
    actFilter === "all"
      ? true
      : actFilter === "shows"
        ? n.type === "new_show" || n.type === "taste_match"
        : n.type !== "new_show" && n.type !== "taste_match",
  );

  const mono = {
    fontFamily: "'DM Mono',monospace",
    fontSize: 10,
    color: "#666",
  };
  const tabStyle = (on) => ({
    flex: 1,
    padding: "8px 0",
    background: "transparent",
    border: "none",
    borderBottom: "2px solid " + (on ? "#F5A623" : "transparent"),
    color: on ? "#F5A623" : "#666",
    fontFamily: "'DM Mono',monospace",
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
    cursor: "pointer",
  });
  const chip = (on) => ({
    padding: "4px 10px",
    borderRadius: 12,
    background: on ? "rgba(245,166,35,.1)" : "transparent",
    border: "1px solid " + (on ? "rgba(245,166,35,.4)" : "#222"),
    color: on ? "#F5A623" : "#666",
    fontFamily: "'DM Mono',monospace",
    fontSize: 10,
    cursor: "pointer",
  });

  return (
    <div className="mwrap" onClick={onClose}>
      <div
        className="sheet"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 460 }}
      >
        <div className="sheet-bar" style={{ background: "#F5A623" }} />
        <div style={{ padding: "10px 18px 22px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <div
              style={{
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: 24,
                color: "#fff",
                letterSpacing: 1,
              }}
            >
              Inbox
            </div>
            <button
              onClick={onReportBug}
              style={{
                background: "none",
                border: "1px solid #1e1e1e",
                color: "#888",
                fontSize: 11,
                fontFamily: "'DM Mono',monospace",
                padding: "5px 10px",
                borderRadius: 5,
                cursor: "pointer",
              }}
            >
              🐛 Report a bug
            </button>
          </div>

          <div style={{ display: "flex", marginBottom: 14 }}>
            <button
              style={tabStyle(tab === "messages")}
              onClick={() => setTab("messages")}
            >
              Messages
              {unreadM + crewUnreadTotal > 0
                ? " (" + (unreadM + crewUnreadTotal) + ")"
                : ""}
            </button>
            <button
              style={tabStyle(tab === "activity")}
              onClick={() => setTab("activity")}
            >
              Activity{unreadN > 0 ? " (" + unreadN + ")" : ""}
            </button>
          </div>

          {/* ── MESSAGES ── */}
          {tab === "messages" && !activeThread && !activeCrew && (
            <div>
              {!showCompose ? (
                <button
                  onClick={() => setShowCompose(true)}
                  style={{
                    width: "100%",
                    marginBottom: 10,
                    padding: "9px 0",
                    background: "transparent",
                    border: "1px dashed #2a2a2a",
                    borderRadius: 6,
                    color: "#888",
                    fontFamily: "'DM Mono',monospace",
                    fontSize: 11,
                    letterSpacing: 1,
                    cursor: "pointer",
                  }}
                >
                  ✎ NEW MESSAGE
                </button>
              ) : (
                <div style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'DM Mono',monospace",
                        fontSize: 10,
                        letterSpacing: 2,
                        color: "#F5A623",
                        textTransform: "uppercase",
                      }}
                    >
                      Message someone
                    </span>
                    <button
                      onClick={() => setShowCompose(false)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#666",
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  {users.filter(
                    (u) => u.id !== curUser.id && isConnected(u.id),
                  ).length === 0 ? (
                    <div
                      style={{
                        fontFamily: "'DM Mono',monospace",
                        fontSize: 10,
                        color: "#666",
                        padding: "8px 0",
                      }}
                    >
                      Follow someone (or get followed) to start a chat.
                    </div>
                  ) : (
                    users
                      .filter((u) => u.id !== curUser.id && isConnected(u.id))
                      .map((u2) => (
                        <div
                          key={u2.id}
                          onClick={() => {
                            setShowCompose(false);
                            setActiveThread(u2.id);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "8px 4px",
                            borderBottom: "1px solid #141414",
                            cursor: "pointer",
                          }}
                        >
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              background: u2.color,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 9,
                              fontWeight: 700,
                              color: "#000",
                            }}
                          >
                            {u2.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span
                            style={{
                              fontFamily: "'Syne',sans-serif",
                              fontSize: 13,
                            }}
                          >
                            {u2.name}
                          </span>
                        </div>
                      ))
                  )}
                </div>
              )}
              {myCrews.length > 0 && (
                <div style={{ margin: "2px 0 10px" }}>
                  <div
                    style={{
                      fontFamily: "'DM Mono',monospace",
                      fontSize: 9,
                      letterSpacing: 2,
                      color: "#555",
                      textTransform: "uppercase",
                      marginBottom: 4,
                    }}
                  >
                    Crews
                  </div>
                  {myCrews.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setActiveCrew(t.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "9px 4px",
                        borderBottom: "1px solid #141414",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 8,
                          background: "#1d1d1d",
                          border: "1px solid #2a2a2a",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                          flexShrink: 0,
                        }}
                      >
                        👥
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontFamily: "'Syne',sans-serif",
                            fontSize: 14,
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {t.show_artist}
                        </div>
                        <div style={mono}>
                          {t.show_date} · {(t.thread_members || []).length} in
                          the crew
                        </div>
                      </div>
                      {crewUnread(t) && (
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "#F5A623",
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
              {threadIds.length === 0 ? (
                <div
                  style={{
                    color: "#666",
                    fontFamily: "'Syne',sans-serif",
                    fontSize: 13,
                    padding: "24px 0",
                    textAlign: "center",
                  }}
                >
                  No messages yet — hit ✎ New message, or share a show
                  from any show page.
                </div>
              ) : (
                threadIds.map((tid) => {
                  const u2 = users.find((u) => u.id === tid);
                  const t = threads[tid];
                  const preview = t.last.show
                    ? "🎟 " + (t.last.show.artist || "a show")
                    : t.last.body;
                  return (
                    <div
                      key={tid}
                      onClick={() => setActiveThread(tid)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "11px 4px",
                        borderBottom: "1px solid #141414",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          background: u2 ? u2.color : "#333",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#000",
                          flexShrink: 0,
                        }}
                      >
                        {(u2 ? u2.name : "??").slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontFamily: "'Syne',sans-serif",
                            fontSize: 14,
                            fontWeight: t.unread ? 700 : 500,
                          }}
                        >
                          {u2 ? u2.name : "Member"}
                          {isRequest(tid) && (
                            <span
                              style={{
                                fontFamily: "'DM Mono',monospace",
                                fontSize: 9,
                                color: "#F5A623",
                                marginLeft: 6,
                                letterSpacing: 1,
                              }}
                            >
                              · REQUEST
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            ...mono,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            color: t.unread ? "#aaa" : "#555",
                          }}
                        >
                          {t.last.sender_id === curUser.id ? "You: " : ""}
                          {preview}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={mono}>{timeAgo(t.last.created_at)}</div>
                        {t.unread > 0 && (
                          <div
                            style={{
                              marginTop: 4,
                              marginLeft: "auto",
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: "#F5A623",
                            }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {tab === "messages" && activeThread && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <button
                  className="back-btn"
                  onClick={() => setActiveThread(null)}
                >
                  ←
                </button>
                <span
                  onClick={() => other && onViewProfile(other.id)}
                  style={{
                    fontFamily: "'Syne',sans-serif",
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {other ? other.name : "Member"}
                </span>
              </div>
              {isRequest(activeThread) && (
                <div
                  style={{
                    padding: "8px 10px",
                    marginBottom: 10,
                    background: "rgba(245,166,35,.05)",
                    border: "1px solid rgba(245,166,35,.2)",
                    borderRadius: 6,
                    fontFamily: "'DM Mono',monospace",
                    fontSize: 10,
                    color: "#888",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <span>
                    {(other ? other.name : "Someone") +
                      " wants to connect — reply to accept."}
                  </span>
                  <button
                    onClick={() => onBlock(activeThread)}
                    style={{
                      background: "none",
                      border: "1px solid #442222",
                      color: "#ff6b6b",
                      fontFamily: "'DM Mono',monospace",
                      fontSize: 10,
                      padding: "4px 9px",
                      borderRadius: 5,
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    Block
                  </button>
                </div>
              )}
              <div
                ref={listRef}
                style={{
                  maxHeight: "45vh",
                  overflowY: "auto",
                  padding: "4px 2px",
                }}
              >
                {threadMsgs.map((m) => {
                  const mine = m.sender_id === curUser.id;
                  return (
                    <div
                      key={m.id}
                      style={{
                        display: "flex",
                        justifyContent: mine ? "flex-end" : "flex-start",
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "78%",
                          padding: "8px 12px",
                          borderRadius: 10,
                          background: mine
                            ? "rgba(245,166,35,.12)"
                            : "#161616",
                          border:
                            "1px solid " +
                            (mine ? "rgba(245,166,35,.3)" : "#222"),
                          fontFamily: "'Syne',sans-serif",
                          fontSize: 13,
                          color: "#f0ede8",
                        }}
                      >
                        {m.show && (
                          <div
                            style={{
                              padding: "8px 10px",
                              marginBottom: m.body ? 6 : 0,
                              background: "#0c0c0c",
                              border: "1px solid #2a2a2a",
                              borderRadius: 6,
                            }}
                          >
                            <div
                              style={{
                                fontFamily: "'Bebas Neue',sans-serif",
                                fontSize: 16,
                                letterSpacing: 1,
                              }}
                            >
                              🎟 {m.show.artist}
                            </div>
                            <div style={mono}>
                              {m.show.venue}
                              {m.show.city ? " · " + m.show.city : ""}
                              {m.show.date ? " · " + m.show.date : ""}
                            </div>
                          </div>
                        )}
                        {m.body}
                        <div
                          style={{
                            ...mono,
                            fontSize: 8,
                            marginTop: 4,
                            textAlign: mine ? "right" : "left",
                          }}
                        >
                          {timeAgo(m.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") send();
                  }}
                  placeholder={
                    "Message " + (other ? other.name : "") + "…"
                  }
                  style={{
                    flex: 1,
                    background: "#0c0c0c",
                    border: "1px solid #1e1e1e",
                    borderRadius: 6,
                    color: "#f0ede8",
                    fontFamily: "'Syne',sans-serif",
                    fontSize: 13,
                    padding: "10px 12px",
                    outline: "none",
                  }}
                />
                <button
                  onClick={send}
                  disabled={!draft.trim()}
                  style={{
                    padding: "0 16px",
                    background: draft.trim()
                      ? "#F5A623"
                      : "rgba(245,166,35,.2)",
                    border: "none",
                    borderRadius: 6,
                    color: "#000",
                    fontFamily: "'DM Mono',monospace",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: draft.trim() ? "pointer" : "default",
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          )}

          {tab === "messages" && activeCrew && (
            <div>
              {(() => {
                const t = (crews || []).find((x) => x.id === activeCrew);
                return (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 10,
                    }}
                  >
                    <button
                      className="back-btn"
                      onClick={() => setActiveCrew(null)}
                    >
                      ←
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: "'Syne',sans-serif",
                          fontSize: 15,
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        👥 {t ? t.show_artist : "Crew"}
                      </div>
                      <div style={mono}>
                        {t
                          ? t.show_date +
                            " · " +
                            (t.thread_members || []).length +
                            " in the crew"
                          : ""}
                      </div>
                    </div>
                    <button
                      onClick={() => onLeaveCrew(activeCrew)}
                      style={{
                        background: "none",
                        border: "1px solid #2a2a2a",
                        color: "#666",
                        fontFamily: "'DM Mono',monospace",
                        fontSize: 10,
                        padding: "4px 9px",
                        borderRadius: 5,
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      Leave
                    </button>
                  </div>
                );
              })()}
              <div
                ref={listRef}
                style={{
                  maxHeight: "45vh",
                  overflowY: "auto",
                  padding: "4px 2px",
                }}
              >
                {crewMsgs.length === 0 && (
                  <div
                    style={{
                      color: "#666",
                      fontFamily: "'Syne',sans-serif",
                      fontSize: 13,
                      padding: "18px 0",
                      textAlign: "center",
                    }}
                  >
                    No messages yet — say hi to the crew 👋
                  </div>
                )}
                {crewMsgs.map((m) => {
                  const mine = m.sender_id === curUser.id;
                  const sender = users.find((u) => u.id === m.sender_id);
                  return (
                    <div
                      key={m.id}
                      style={{
                        display: "flex",
                        justifyContent: mine ? "flex-end" : "flex-start",
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "78%",
                          padding: "8px 12px",
                          borderRadius: 10,
                          background: mine
                            ? "rgba(245,166,35,.12)"
                            : "#161616",
                          border:
                            "1px solid " +
                            (mine ? "rgba(245,166,35,.3)" : "#222"),
                          fontFamily: "'Syne',sans-serif",
                          fontSize: 13,
                          color: "#f0ede8",
                        }}
                      >
                        {!mine && (
                          <div
                            style={{
                              fontFamily: "'DM Mono',monospace",
                              fontSize: 9,
                              color: sender ? sender.color : "#888",
                              marginBottom: 3,
                            }}
                          >
                            {sender ? sender.name : "Member"}
                          </div>
                        )}
                        {m.body}
                        <div
                          style={{
                            ...mono,
                            fontSize: 8,
                            marginTop: 4,
                            textAlign: mine ? "right" : "left",
                          }}
                        >
                          {timeAgo(m.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendCrew();
                  }}
                  placeholder="Message the crew…"
                  style={{
                    flex: 1,
                    background: "#0c0c0c",
                    border: "1px solid #1e1e1e",
                    borderRadius: 6,
                    color: "#f0ede8",
                    fontFamily: "'Syne',sans-serif",
                    fontSize: 13,
                    padding: "10px 12px",
                    outline: "none",
                  }}
                />
                <button
                  onClick={sendCrew}
                  disabled={!draft.trim()}
                  style={{
                    padding: "0 16px",
                    background: draft.trim()
                      ? "#F5A623"
                      : "rgba(245,166,35,.2)",
                    border: "none",
                    borderRadius: 6,
                    color: "#000",
                    fontFamily: "'DM Mono',monospace",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: draft.trim() ? "pointer" : "default",
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          )}

          {/* ── ACTIVITY ── */}
          {tab === "activity" && (
            <div>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                {[
                  ["all", "All"],
                  ["shows", "Shows"],
                  ["other", "Other"],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    style={chip(actFilter === id)}
                    onClick={() => setActFilter(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {filteredNotifs.length === 0 ? (
                <div
                  style={{
                    color: "#666",
                    fontFamily: "'Syne',sans-serif",
                    fontSize: 13,
                    padding: "24px 0",
                    textAlign: "center",
                  }}
                >
                  Nothing yet.
                </div>
              ) : (
                filteredNotifs.map((n) => {
                  const m = notifMsg(n);
                  return (
                    <div
                      key={n.id}
                      style={{
                        display: "flex",
                        gap: 10,
                        padding: "12px 0",
                        borderBottom: "1px solid #141414",
                      }}
                    >
                      <div style={{ fontSize: 17 }}>{m.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontFamily: "'Syne',sans-serif",
                            fontSize: 13,
                            color: "#ddd",
                            lineHeight: 1.5,
                          }}
                        >
                          {m.text}
                        </div>
                        <div style={{ ...mono, marginTop: 3 }}>
                          {timeAgo(n.created_at)}
                        </div>
                        {m.action === "no_show" && (
                          <div style={{ marginTop: 6 }}>
                            <button
                              onClick={onReportBug}
                              style={{
                                background: "none",
                                border: "1px solid #2a2a2a",
                                color: "#888",
                                fontSize: 10,
                                fontFamily: "'DM Mono',monospace",
                                padding: "4px 9px",
                                borderRadius: 5,
                                cursor: "pointer",
                              }}
                            >
                              Report
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
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
  onGenreClick,
  onShare,
  onToggleHidden,
  crew,
  onStartCrew,
  onJoinCrew,
  onOpenCrew,
}) {
  const u = getUrgency(c.date),
    dy = daysUntil(c.date),
    d = fmt(c.date);
  const dt =
    dy < 0
      ? agoLabel(dy)
      : dy === 0
        ? "Tonight!"
        : dy === 1
          ? "Tomorrow!"
          : dy + " days away";
  const bc = u === "urgent" ? "bdg-u" : u === "soon" ? "bdg-s" : "bdg-n",
    rc = u === "urgent" ? "#FF5555" : "#F5A623";
  const showR = u === "urgent" || u === "soon";
  const isFestival = c.is_festival && c.end_date && c.end_date !== c.date;
  const isCrewMember =
    crew && (crew.thread_members || []).some((m) => m.user_id === curUser.id);
  const crewBtn = {
    margin: "8px 0 2px",
    width: "100%",
    padding: "10px 0",
    background: "rgba(245,166,35,.06)",
    border: "1px solid rgba(245,166,35,.3)",
    borderRadius: 6,
    color: "#F5A623",
    fontFamily: "'DM Mono',monospace",
    fontSize: 11,
    letterSpacing: 1,
    cursor: "pointer",
  };
  const tasteGoing = (c.attendees || []).filter((uid) => {
    if (uid === curUser.id) return false;
    const u2 = users.find((x) => x.id === uid);
    return (
      u2 && (u2.genres || []).some((g) => (curUser.genres || []).includes(g))
    );
  }).length;
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
          {(c.genres || []).length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 5,
                marginTop: 8,
              }}
            >
              {(c.genres || []).map((g) => (
                <span
                  key={g}
                  className="genre-tag"
                  onClick={() => onGenreClick && onGenreClick(g)}
                >
                  {g}
                </span>
              ))}
            </div>
          )}
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
          {tasteGoing > 0 && (
            <div
              style={{
                fontFamily: "'DM Mono',monospace",
                fontSize: 11,
                color: "#F5A623",
                margin: "10px 0 2px",
              }}
            >
              ⚡ {tasteGoing} {tasteGoing === 1 ? "person" : "people"} with
              your taste {tasteGoing === 1 ? "is" : "are"} going
            </div>
          )}
          {onShare && (
            <button
              onClick={() => onShare(c)}
              style={{
                margin: "10px 0 2px",
                width: "100%",
                padding: "10px 0",
                background: "transparent",
                border: "1px solid #2a2a2a",
                borderRadius: 6,
                color: "#aaa",
                fontFamily: "'DM Mono',monospace",
                fontSize: 11,
                letterSpacing: 1,
                cursor: "pointer",
              }}
            >
              ✉ SHARE WITH A FRIEND
            </button>
          )}
          {c.owner_id === curUser.id && onToggleHidden && (
            <button
              onClick={() => onToggleHidden(c)}
              title="Hidden shows never appear to anyone else — not friends, not matches."
              style={{
                margin: "8px 0 2px",
                width: "100%",
                padding: "10px 0",
                background: c.hidden ? "rgba(255,255,255,.04)" : "transparent",
                border: "1px solid " + (c.hidden ? "#3a3a3a" : "#2a2a2a"),
                borderRadius: 6,
                color: c.hidden ? "#ddd" : "#666",
                fontFamily: "'DM Mono',monospace",
                fontSize: 10,
                letterSpacing: 1,
                cursor: "pointer",
              }}
            >
              {c.hidden
                ? "🤫 GOING QUIETLY — ONLY YOU SEE THIS. TAP TO UNHIDE"
                : "👁 VISIBLE TO FRIENDS & MATCHES. TAP TO GO QUIETLY"}
            </button>
          )}
          {curUser.id &&
            (c.attendees || []).includes(curUser.id) &&
            onStartCrew &&
            (crew ? (
              isCrewMember ? (
                <button onClick={() => onOpenCrew(crew.id)} style={crewBtn}>
                  💬 OPEN CREW CHAT ({(crew.thread_members || []).length})
                </button>
              ) : (
                <button onClick={() => onJoinCrew(crew)} style={crewBtn}>
                  👥 JOIN THE CREW — {(crew.thread_members || []).length} IN
                </button>
              )
            ) : (
              <button onClick={() => onStartCrew(c)} style={crewBtn}>
                👥 START A CREW CHAT FOR THIS SHOW
              </button>
            ))}
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
// ── GENRE SEARCH (jump to any genre page) ────────────────────────────────────
function GenreSearch({ onGenreClick }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const matches = q.trim()
    ? GENRES.filter((g) =>
        g.toLowerCase().includes(q.trim().toLowerCase()),
      ).slice(0, 12)
    : [];
  return (
    <div style={{ position: "relative", margin: "14px 0 4px" }}>
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="⌕ Search any genre — find your people"
        style={{
          width: "100%",
          background: "#0c0c0c",
          border: "1px solid #1e1e1e",
          borderRadius: 6,
          color: "#f0ede8",
          fontFamily: "'DM Mono',monospace",
          fontSize: 12,
          padding: "10px 12px",
          outline: "none",
          boxSizing: "border-box",
        }}
      />
      {open && matches.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 30,
            marginTop: 4,
            background: "#111",
            border: "1px solid #222",
            borderRadius: 6,
            overflow: "hidden",
            boxShadow: "0 8px 24px rgba(0,0,0,.5)",
          }}
        >
          {matches.map((g) => (
            <div
              key={g}
              onMouseDown={() => {
                setQ("");
                setOpen(false);
                onGenreClick && onGenreClick(g);
              }}
              style={{
                padding: "9px 12px",
                fontFamily: "'Syne',sans-serif",
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #1a1a1a",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "rgba(245,166,35,.07)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "";
              }}
            >
              <span>{g}</span>
              <span
                style={{
                  fontFamily: "'DM Mono',monospace",
                  fontSize: 9,
                  color: "#555",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                {GENRE_PARENT_OF[g] ||
                  (GENRE_TAXONOMY[g] || []).length + " subgenres"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
  onMessage,
  onGenreClick,
  onArtistClick,
}) {
  const [tab, setTab] = useState("upcoming");
  const [connModal, setConnModal] = useState(null); // null | "followers" | "following"
  const isSelf = user.id === curUser.id;
  const isFollowing = curUser.following.includes(user.id);
  // Shows this user attends, split by date (festivals count as upcoming
  // until their end_date passes). History = real past concerts + legacy seed.
  const attending = concerts.filter((c) =>
    (c.attendees || []).includes(user.id),
  );
  const upcoming = attending
    .filter((c) => daysUntil(c.end_date || c.date) >= 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const past = [
    ...attending.filter((c) => daysUntil(c.end_date || c.date) < 0),
    ...pastShows.filter((p) => user.past?.includes(p.id)),
  ];
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
        {!isSelf && onMessage && (
          <button
            className="prof-follow-btn pf-follow"
            style={{
              background: "transparent",
              border: "1px solid #2a2a2a",
              color: "#aaa",
              marginLeft: 6,
            }}
            onClick={() => onMessage(user.id)}
          >
            ✉ Message
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
        {isSelf && <GenreSearch onGenreClick={onGenreClick} />}
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
                  ? "Add a show or forward a ticket to track it."
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
                  onGenreClick={onGenreClick}
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
  onGenreClick,
}) {
  // Family matching: this genre + its subgenres + its parent.
  const people = users.filter((u) => genreHit(u.genres, genre));
  const shows = concerts.filter((c) => genreHit(c.genres, genre));
  const parent = GENRE_PARENT_OF[genre];
  const subgenres = GENRE_TAXONOMY[genre] || [];
  // Artists ranked by presence in the app: shows (weighted by attendance)
  // beat favorites, favorites beat bucket-list wishes.
  const artistScore = {};
  const bump = (a, n) => {
    if (a) artistScore[a] = (artistScore[a] || 0) + n;
  };
  users.forEach((u) => {
    if (genreHit(u.genres, genre)) {
      (u.artists || []).forEach((a) => bump(a, 2));
      (u.bucketList || []).forEach((a) => bump(a, 1));
    }
  });
  shows.forEach((c) => bump(c.artist, 3 + (c.attendees || []).length));
  const relatedArtists = Object.keys(artistScore).sort(
    (a, b) => artistScore[b] - artistScore[a],
  );
  const upcomingShows = shows
    .filter((c) => daysUntil(c.date) >= 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="genre-page">
      <div className="genre-hdr">
        <button className="back-btn" onClick={onBack}>
          ←
        </button>
        <span className="genre-hdr-name">{genre.toUpperCase()}</span>
        {parent && onGenreClick && (
          <button
            className="uc-genre"
            style={{ marginLeft: 10 }}
            onClick={() => onGenreClick(parent)}
          >
            part of {parent} ↗
          </button>
        )}
      </div>
      <div className="genre-content">
        {/* Subgenre navigation for parent genres */}
        {subgenres.length > 0 && onGenreClick && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 5,
              marginBottom: 18,
            }}
          >
            {subgenres.map((s) => (
              <button
                key={s}
                className="uc-genre"
                onClick={() => onGenreClick(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}
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
          {upcomingShows.length === 0 ? (
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
              {upcomingShows.map((c) => {
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
          <div
            style={{
              fontFamily: "'DM Mono',monospace",
              fontSize: 10,
              color: "#555",
              margin: "-6px 0 12px",
            }}
          >
            Shows people who are Open to Connect, plus your friends.
          </div>
          {people.length === 0 ? (
            <div className="empty" style={{ padding: "20px 0" }}>
              <div className="empty-s">
                No one in the app lists this genre yet.
              </div>
            </div>
          ) : (
            [...people]
              .sort(
                (a, b) =>
                  matchInfo(curUser, b, concerts).score -
                  matchInfo(curUser, a, concerts).score,
              )
              .map((u2) => {
              const isF = curUser.following.includes(u2.id);
              const mi = matchInfo(curUser, u2, concerts);
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
                    {mi.line && (
                      <div className="uc-mutual">{mi.line}</div>
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
function EditProfilePage({ user, onBack, onSave, onClearShows, showCount }) {
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
    discoverable: !!user.discoverable,
    totalShows: user.totalShows || "",
    social: { instagram: "", ...(user.social || {}) },
  });
  const set = (k, v) => setDraft((p) => ({ ...p, [k]: v }));
  const setSocial = (k, v) =>
    setDraft((p) => ({ ...p, social: { ...p.social, [k]: v } }));
  const bioLen = draft.bio.length;
  const [armClear, setArmClear] = useState(false);

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
        <div className="edit-sec-title">Privacy</div>
        <div
          onClick={() => set("discoverable", !draft.discoverable)}
          style={{
            padding: "14px 15px",
            background: draft.discoverable ? "rgba(245,166,35,.06)" : "#0c0c0c",
            border:
              "1px solid " +
              (draft.discoverable ? "rgba(245,166,35,.35)" : "#1e1e1e"),
            borderRadius: 8,
            cursor: "pointer",
            transition: "all .15s",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <div
              style={{
                fontFamily: "'Syne',sans-serif",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              🔓 Open to Connect
            </div>
            <div
              style={{
                fontFamily: "'DM Mono',monospace",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 1,
                padding: "3px 10px",
                borderRadius: 10,
                color: draft.discoverable ? "#F5A623" : "#555",
                border:
                  "1px solid " +
                  (draft.discoverable ? "rgba(245,166,35,.4)" : "#2a2a2a"),
              }}
            >
              {draft.discoverable ? "ON" : "OFF"}
            </div>
          </div>
          <div
            style={{
              fontFamily: "'DM Mono',monospace",
              fontSize: 10,
              color: "#666",
              marginTop: 8,
              lineHeight: 1.6,
            }}
          >
            {draft.discoverable
              ? "Your profile, genres, and upcoming shows are visible to everyone. Strangers only ever see past shows you both attended."
              : "Only friends and people you follow can see your profile. You won't appear in genre pages or search."}
          </div>
        </div>
      </div>

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

      {/* DANGER ZONE */}
      <div
        className="edit-section"
        style={{ marginTop: 20, paddingBottom: 24 }}
      >
        <div className="edit-sec-title" style={{ color: "#ff6b6b" }}>
          Danger Zone
        </div>
        <div
          style={{
            fontFamily: "'DM Mono',monospace",
            fontSize: 10,
            color: "#666",
            lineHeight: 1.6,
            marginBottom: 10,
          }}
        >
          Deletes all {showCount || 0} of your shows — history, stats, the
          lot. They come back if you re-forward your ticket emails (or add
          shows manually). Follows, messages, and your profile are untouched.
        </div>
        {!armClear ? (
          <button
            onClick={() => setArmClear(true)}
            style={{
              background: "transparent",
              border: "1px solid #442222",
              color: "#ff6b6b",
              padding: "9px 14px",
              borderRadius: 6,
              fontFamily: "'DM Mono',monospace",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            ⌫ Clear all my shows…
          </button>
        ) : (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={() => {
                setArmClear(false);
                onClearShows && onClearShows();
              }}
              style={{
                background: "rgba(255,107,107,.12)",
                border: "1px solid #ff6b6b",
                color: "#ff6b6b",
                padding: "9px 14px",
                borderRadius: 6,
                fontFamily: "'DM Mono',monospace",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              Yes, delete all {showCount || 0} shows
            </button>
            <button
              onClick={() => setArmClear(false)}
              style={{
                background: "transparent",
                border: "1px solid #2a2a2a",
                color: "#888",
                padding: "9px 14px",
                borderRadius: 6,
                fontFamily: "'DM Mono',monospace",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        )}
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
  // Match-ranked strangers: strongest overlap first, people I follow excluded.
  const likeYou = others
    .map((u2) => ({ u2, mi: matchInfo(curUser, u2, concerts) }))
    .filter(
      (x) => x.mi.score > 0 && !(curUser.following || []).includes(x.u2.id),
    )
    .sort((a, b) => b.mi.score - a.mi.score)
    .slice(0, 5);
  return (
    <div className="search-page">
      <div className="pg-head">
        <div className="pg-title">Discover</div>
      </div>
      {curUser.id && likeYou.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              fontFamily: "'DM Mono',monospace",
              fontSize: 10,
              letterSpacing: 2,
              color: "#F5A623",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            ⚡ People like you
          </div>
          {likeYou.map(({ u2, mi }) => (
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
                  @{u2.handle}
                  {u2.location ? " · " + u2.location : ""}
                </div>
                {mi.line && <div className="uc-mutual">{mi.line}</div>}
              </div>
              <button
                className="uc-follow ucf-n"
                onClick={(e) => {
                  e.stopPropagation();
                  onFollowToggle(u2.id);
                }}
              >
                Follow
              </button>
            </div>
          ))}
        </div>
      )}
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
  const [loading, setLoading] = useState(null); // provider id while redirecting
  const [error, setError] = useState(null);

  const signIn = async (provider) => {
    setLoading(provider);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: "https://encorefriends.com/app.html" },
    });
    if (error) {
      setError(error.message);
      setLoading(null);
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
        {(() => {
          const btn = (bg, fg, border) => ({
            width: "100%",
            padding: "13px 20px",
            background: bg,
            color: fg,
            border: border || "none",
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
            marginBottom: 10,
            transition: "all .15s",
          });
          const marks = {
            google: (
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
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
            ),
            apple: (
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09z" />
              </svg>
            ),
            facebook: (
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
              </svg>
            ),
          };
          const skin = {
            google: ["#fff", "#000", null],
            apple: ["#000", "#fff", "1px solid #333"],
            facebook: ["#1877F2", "#fff", null],
          };
          const name = { google: "Google", apple: "Apple", facebook: "Facebook" };
          return AUTH_PROVIDERS.filter((p) => marks[p]).map((p) => (
            <button
              key={p}
              onClick={() => signIn(p)}
              disabled={!!loading}
              style={btn(...skin[p])}
            >
              {marks[p]}
              {loading === p ? "Signing in…" : "Continue with " + name[p]}
            </button>
          ));
        })()}
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
        setResults(d.artists || []);
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
  const shown = results.filter((a) => !value.includes(a.name)).slice(0, 8);

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
              {shown.map((a) => (
                <div
                  key={a.id || a.name}
                  className="tag-opt"
                  onMouseDown={() => add(a.name)}
                  style={{ display: "flex", alignItems: "center", gap: 10 }}
                >
                  {a.image ? (
                    <img
                      src={a.image}
                      alt=""
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: "#222",
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <span style={{ flex: 1 }}>{a.name}</span>
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

// ── OSM (OpenStreetMap / Nominatim) venue + city autocomplete ────────────────
// Hits the keyless place-search Netlify proxy. Picking a result fills the
// venue + city fields below, which stay editable for manual correction.
function PlaceSearch({ onPick, placeholder }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(
          "/.netlify/functions/place-search?q=" + encodeURIComponent(term),
        );
        const d = await r.json();
        setResults(d.places || []);
      } catch (e) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500); // gentle on Nominatim's ~1 req/sec usage policy
    return () => clearTimeout(t);
  }, [q]);

  const pick = (p) => {
    onPick(p);
    setQ("");
    setResults([]);
    setOpen(false);
  };

  return (
    <div className="tag-search-wrap">
      <input
        className="tag-search-inp"
        placeholder={placeholder || "Search venue or address…"}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && q.trim().length >= 3 && (
        <div className="tag-drop">
          {loading && results.length === 0 && (
            <div className="tag-opt" style={{ color: "#555" }}>
              Searching…
            </div>
          )}
          {!loading && results.length === 0 && (
            <div className="tag-opt" style={{ color: "#555" }}>
              No matches — just type it in below.
            </div>
          )}
          {results.map((p, i) => (
            <div
              key={i}
              className="tag-opt"
              onMouseDown={() => pick(p)}
              style={{ display: "block" }}
            >
              <div style={{ color: "#eee" }}>{p.venue || p.city}</div>
              <div
                style={{
                  fontSize: 10,
                  fontFamily: "'DM Mono',monospace",
                  color: "#777",
                  marginTop: 2,
                }}
              >
                {p.full || p.city}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sleek calendar date picker (Encore dark aesthetic, no library) ───────────
function DatePicker({ value, onChange }) {
  const base = value ? new Date(value + "T12:00:00") : new Date();
  const [open, setOpen] = useState(false);
  const [vy, setVy] = useState(base.getFullYear());
  const [vm, setVm] = useState(base.getMonth());

  const MO = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const DOW = ["S", "M", "T", "W", "T", "F", "S"];
  const startDow = new Date(vy, vm, 1).getDay();
  const daysInMonth = new Date(vy, vm + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prev = () => {
    if (vm === 0) {
      setVm(11);
      setVy(vy - 1);
    } else setVm(vm - 1);
  };
  const next = () => {
    if (vm === 11) {
      setVm(0);
      setVy(vy + 1);
    } else setVm(vm + 1);
  };
  const pick = (d) => {
    const mm = String(vm + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    onChange(vy + "-" + mm + "-" + dd);
    setOpen(false);
  };

  const label = value
    ? new Date(value + "T12:00:00").toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Pick a date";

  const navBtn = {
    background: "none",
    border: "none",
    color: "#F5A623",
    fontSize: 20,
    cursor: "pointer",
    padding: "0 8px",
    lineHeight: 1,
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="form-inp"
        style={{
          textAlign: "left",
          cursor: "pointer",
          color: value ? "#eee" : "#666",
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>{label}</span>
        <span style={{ color: "#F5A623" }}>▾</span>
      </button>
      {open && (
        <div
          style={{
            marginTop: 6,
            background: "#0c0c0c",
            border: "1px solid #1e1e1e",
            borderRadius: 8,
            padding: 12,
            width: 268,
            maxWidth: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <button type="button" onClick={prev} style={navBtn}>
              ‹
            </button>
            <div
              style={{
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: 17,
                letterSpacing: 1,
                color: "#eee",
              }}
            >
              {MO[vm]} {vy}
            </div>
            <button type="button" onClick={next} style={navBtn}>
              ›
            </button>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7,1fr)",
              gap: 2,
              marginBottom: 4,
            }}
          >
            {DOW.map((d, i) => (
              <div
                key={i}
                style={{
                  textAlign: "center",
                  fontFamily: "'DM Mono',monospace",
                  fontSize: 9,
                  color: "#555",
                  padding: "2px 0",
                }}
              >
                {d}
              </div>
            ))}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7,1fr)",
              gap: 2,
            }}
          >
            {cells.map((d, i) => {
              if (!d) return <div key={i} />;
              const ds =
                vy +
                "-" +
                String(vm + 1).padStart(2, "0") +
                "-" +
                String(d).padStart(2, "0");
              const isSel = ds === value;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => pick(d)}
                  style={{
                    aspectRatio: "1",
                    border: "none",
                    borderRadius: 5,
                    cursor: "pointer",
                    fontFamily: "'DM Mono',monospace",
                    fontSize: 12,
                    background: isSel ? "#F5A623" : "transparent",
                    color: isSel ? "#000" : "#ccc",
                  }}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── EMAIL-FORWARDING SETUP (auto-tracking) ───────────────────────────────────
// A friendly ~1-minute walkthrough: the user copies their private Encore
// address, adds it to Gmail forwarding (which the backend auto-verifies), and
// creates one filter so only ticket emails forward in.
function MailConnect({ session, profile, onTokenReady, onClose }) {
  const [token, setToken] = useState((profile && profile.forward_token) || "");
  const [verified, setVerified] = useState(
    !!(profile && profile.forward_verified),
  );
  const [confirmCode, setConfirmCode] = useState(
    (profile && profile.forward_confirm_code) || "",
  );
  const [confirmLink, setConfirmLink] = useState(
    (profile && profile.forward_confirm_link) || "",
  );
  const [copied, setCopied] = useState("");

  // Mint a private, unguessable token once, and save it to the profile.
  useEffect(() => {
    if (token || !session?.user?.id) return;
    const t =
      "e" +
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID().replace(/-/g, "")
        : Math.random().toString(36).slice(2) + Date.now().toString(36));
    (async () => {
      await supabase
        .from("profiles")
        .update({ forward_token: t })
        .eq("id", session.user.id);
      setToken(t);
      onTokenReady && onTokenReady(t);
    })();
  }, []);

  // Once the backend auto-confirms the forward, it flips forward_verified.
  useEffect(() => {
    if (verified || !session?.user?.id) return;
    const iv = setInterval(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("forward_verified, forward_confirm_code, forward_confirm_link")
        .eq("id", session.user.id)
        .single();
      if (data && data.forward_confirm_code)
        setConfirmCode(data.forward_confirm_code);
      if (data && data.forward_confirm_link)
        setConfirmLink(data.forward_confirm_link);
      if (data && data.forward_verified) {
        setVerified(true);
        clearInterval(iv);
      }
    }, 5000);
    return () => clearInterval(iv);
  }, [verified]);

  const addr = token ? token + "@" + FORWARD_DOMAIN : "generating…";
  const FILTER_QUERY =
    '{from:(ticketmaster OR livenation OR seatgeek OR axs.com OR dice.fm OR ra.co OR residentadvisor OR eventbrite OR seetickets OR ticketweb OR etix OR tixr OR bandsintown OR songkick OR stubhub OR vividseats OR frontgatetickets OR eventim OR moshtix OR ticketek) "your tickets" "e-ticket" "general admission" "doors open" "will call" "your seats" "the lineup" "set times" "live music" concert festival}';

  const copy = (txt, which) => {
    try {
      if (navigator.clipboard) navigator.clipboard.writeText(txt);
    } catch (e) {}
    setCopied(which);
    setTimeout(() => setCopied(""), 1600);
  };

  // Copy what they'll need to paste, then drop them on the right Gmail screen.
  const openWith = (txt, url) => {
    try {
      if (navigator.clipboard && txt) navigator.clipboard.writeText(txt);
    } catch (e) {}
    window.open(url, "_blank", "noopener");
  };

  // Gmail only exposes forwarding rules/filters on desktop, so phones get a
  // simpler path: just forward tickets manually (no setup, no verification).
  const isMobile =
    typeof navigator !== "undefined" &&
    /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");

  const card = {
    background: "#0c0c0c",
    border: "1px solid #1e1e1e",
    borderRadius: 10,
    padding: 18,
    marginBottom: 14,
  };
  const num = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 24,
    borderRadius: "50%",
    background: "#F5A623",
    color: "#000",
    fontFamily: "'DM Mono',monospace",
    fontSize: 12,
    fontWeight: 700,
    marginRight: 10,
    flexShrink: 0,
  };
  const stepHead = {
    display: "flex",
    alignItems: "center",
    fontFamily: "'Bebas Neue',sans-serif",
    fontSize: 19,
    letterSpacing: 0.5,
    color: "#eee",
    marginBottom: 10,
  };
  const body = {
    fontFamily: "'Syne',sans-serif",
    fontSize: 13,
    lineHeight: 1.55,
    color: "#aaa",
    margin: "0 0 12px 34px",
  };
  const ghost = {
    display: "inline-block",
    fontFamily: "'DM Mono',monospace",
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#F5A623",
    border: "1px solid #2a2a2a",
    borderRadius: 6,
    padding: "8px 12px",
    textDecoration: "none",
    marginLeft: 34,
  };
  const copyBox = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginLeft: 34,
    marginBottom: 12,
  };
  const codeBox = {
    flex: 1,
    fontFamily: "'DM Mono',monospace",
    fontSize: 12,
    background: "#000",
    border: "1px solid #1e1e1e",
    borderRadius: 6,
    padding: "10px 12px",
    wordBreak: "break-all",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "#070707",
        overflowY: "auto",
      }}
    >
      <div
        style={{ maxWidth: 560, margin: "0 auto", padding: "32px 18px 60px" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 8,
          }}
        >
          <div
            style={{
              fontFamily: "'DM Mono',monospace",
              fontSize: 10,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "#F5A623",
            }}
          >
            Auto-tracking
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#666",
              fontFamily: "'DM Mono',monospace",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            I'll do this later ✕
          </button>
        </div>

        <h1
          style={{
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: 38,
            letterSpacing: 1,
            color: "#fff",
            margin: "0 0 6px",
            lineHeight: 1,
          }}
        >
          Track shows on autopilot
        </h1>
        <p
          style={{
            fontFamily: "'Syne',sans-serif",
            fontSize: 14,
            color: "#999",
            margin: "0 0 24px",
            lineHeight: 1.5,
          }}
        >
          {isMobile
            ? "Forward any ticket email to your private Encore address and it shows up here — no setup needed, right from the Gmail app."
            : "Set this up once and your concerts add themselves — every time you buy a ticket, it just shows up. Takes about a minute, and you'll never tap \"add\" again."}
        </p>

        <div style={card}>
          <div style={stepHead}>
            <span style={num}>1</span> Copy your private Encore address
          </div>
          <div style={copyBox}>
            <code style={{ ...codeBox, color: "#F5A623" }}>{addr}</code>
            <button
              onClick={() => copy(addr, "addr")}
              className="btn-sm btn-amber"
              style={{ whiteSpace: "nowrap" }}
            >
              {copied === "addr" ? "Copied ✓" : "Copy"}
            </button>
          </div>
          <p style={body}>
            This one's yours alone. It isn't an inbox you check — just a private
            drop box where Gmail tucks your ticket emails so Encore can read
            them.
          </p>
        </div>

        {isMobile ? (
          <div style={card}>
            <div style={stepHead}>
              <span style={num}>2</span> Forward your tickets
            </div>
            <p style={body}>
              In the Gmail app, open a ticket confirmation → tap the{" "}
              <b style={{ color: "#ccc" }}>Forward</b> arrow → send it to the
              address above. It shows up in your feed within a few seconds.
            </p>
            <div
              style={{
                marginLeft: 34,
                marginTop: 4,
                padding: "12px 14px",
                background: "#0c0c0c",
                border: "1px solid #1e1e1e",
                borderRadius: 8,
                fontFamily: "'Syne',sans-serif",
                fontSize: 12.5,
                color: "#888",
                lineHeight: 1.5,
              }}
            >
              Want it fully hands-off, with no manual forwarding? Gmail only
              lets you set up auto-forwarding on a computer — open Encore on a
              laptop anytime and we'll walk you through the one-minute setup.
            </div>
          </div>
        ) : (
          <>
            <div style={card}>
              <div style={stepHead}>
                <span style={num}>2</span> Paste it into Gmail
          </div>
          <p style={body}>
            Open Gmail's forwarding settings, click{" "}
            <b style={{ color: "#ccc" }}>Add a forwarding address</b>, paste your
            address, and hit Next → Proceed.
          </p>
          <button
            type="button"
            onClick={() =>
              openWith(
                addr,
                "https://mail.google.com/mail/u/0/#settings/fwdandpop",
              )
            }
            style={{ ...ghost, background: "none", cursor: "pointer" }}
          >
            Open Gmail forwarding — address copied ↗
          </button>
          <div
            style={{
              marginLeft: 34,
              marginTop: 6,
              fontFamily: "'DM Mono',monospace",
              fontSize: 11,
              color: "#666",
              lineHeight: 1.5,
            }}
          >
            Panel didn't fully load? Click the ⚙ gear → See all settings →
            Forwarding and POP/IMAP → Add a forwarding address, then paste
            (your address is already copied).
          </div>
          <div
            style={{
              marginLeft: 34,
              marginTop: 14,
              fontFamily: "'Syne',sans-serif",
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            {verified ? (
              <span style={{ color: "#5cc46a" }}>
                ✓ Verified — Gmail's all set.
              </span>
            ) : confirmLink ? (
              <div>
                <div style={{ color: "#aaa", marginBottom: 8 }}>
                  Gmail sent its confirmation — one tap to finish. This opens
                  Google; just hit <b style={{ color: "#ccc" }}>Confirm</b>:
                </div>
                <button
                  type="button"
                  onClick={() =>
                    window.open(confirmLink, "_blank", "noopener")
                  }
                  className="btn-sm btn-amber"
                >
                  Finish verifying in Gmail →
                </button>
              </div>
            ) : confirmCode ? (
              <span style={{ color: "#aaa" }}>
                Almost there — enter this code on Gmail's forwarding screen:{" "}
                <b
                  style={{
                    color: "#F5A623",
                    fontFamily: "'DM Mono',monospace",
                  }}
                >
                  {confirmCode}
                </b>
              </span>
            ) : (
              <span style={{ color: "#888" }}>
                <span style={{ opacity: 0.7 }}>◌</span> Waiting for Gmail's
                confirmation… once you add the address above, a "Finish
                verifying" button shows up here within a few seconds.
              </span>
            )}
          </div>
        </div>

        <div style={card}>
          <div style={stepHead}>
            <span style={num}>3</span> Choose what forwards
          </div>
          <p style={body}>
            One filter keeps it to ticket emails only — nothing else leaves your
            inbox. In Gmail filters, click{" "}
            <b style={{ color: "#ccc" }}>Create a new filter</b> and paste this
            into the <b style={{ color: "#ccc" }}>Has the words</b> box:
          </p>
          <div style={copyBox}>
            <code style={{ ...codeBox, color: "#ccc", fontSize: 11.5 }}>
              {FILTER_QUERY}
            </code>
            <button
              onClick={() => copy(FILTER_QUERY, "q")}
              className="btn-sm btn-amber"
              style={{ whiteSpace: "nowrap" }}
            >
              {copied === "q" ? "Copied ✓" : "Copy"}
            </button>
          </div>
          <p style={body}>
            Then <b style={{ color: "#ccc" }}>Create filter</b> → check{" "}
            <b style={{ color: "#ccc" }}>Forward it to</b> → pick your Encore
            address → <b style={{ color: "#ccc" }}>Create filter</b>. That's it.
          </p>
          <button
            type="button"
            onClick={() =>
              openWith(
                FILTER_QUERY,
                "https://mail.google.com/mail/u/0/#settings/filters",
              )
            }
            style={{ ...ghost, background: "none", cursor: "pointer" }}
          >
            Open Gmail filters — filter text copied ↗
          </button>
          <div
            style={{
              marginLeft: 34,
              marginTop: 6,
              fontFamily: "'DM Mono',monospace",
              fontSize: 11,
              color: "#666",
              lineHeight: 1.5,
            }}
          >
            Not showing? ⚙ gear → See all settings → Filters and Blocked
            Addresses → Create a new filter (the filter text is copied).
          </div>
            </div>
          </>
        )}

        <div
          style={{
            background: verified ? "rgba(92,196,106,0.08)" : "#0c0c0c",
            border:
              "1px solid " + (verified ? "rgba(92,196,106,0.4)" : "#1e1e1e"),
            borderRadius: 10,
            padding: 16,
            textAlign: "center",
            fontFamily: "'Syne',sans-serif",
            fontSize: 13,
            color: verified ? "#9fd9a0" : "#888",
            margin: "4px 0 20px",
          }}
        >
          {verified
            ? "✓ Connected. New tickets land here on their own from now on."
            : isMobile
              ? "Forward a ticket to your address above and it'll appear here in seconds."
              : "Once Gmail's set, new ticket emails flow in automatically — even when Encore is closed."}
        </div>

        <div style={{ textAlign: "center" }}>
          <button
            onClick={onClose}
            className="btn-amber"
            style={{ padding: "12px 28px" }}
          >
            {verified ? "Done" : "Got it"}
          </button>
        </div>
      </div>
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
  const [discoverable, setDiscoverable] = useState(!!p.discoverable);
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
      discoverable,
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

            <div
              onClick={() => setDiscoverable((d) => !d)}
              style={{
                marginTop: 24,
                padding: "14px 15px",
                background: discoverable ? "rgba(245,166,35,.06)" : "#0c0c0c",
                border:
                  "1px solid " +
                  (discoverable ? "rgba(245,166,35,.35)" : "#1e1e1e"),
                borderRadius: 8,
                cursor: "pointer",
                transition: "all .15s",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    fontFamily: "'Syne',sans-serif",
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  🔓 Open to Connect
                </div>
                <div
                  style={{
                    fontFamily: "'DM Mono',monospace",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 1,
                    padding: "3px 10px",
                    borderRadius: 10,
                    color: discoverable ? "#F5A623" : "#555",
                    border:
                      "1px solid " +
                      (discoverable ? "rgba(245,166,35,.4)" : "#2a2a2a"),
                  }}
                >
                  {discoverable ? "ON" : "OFF"}
                </div>
              </div>
              <div style={{ ...help, marginTop: 8 }}>
                Looking to make friends and hit shows together? Open your
                profile so people who share your taste can find you. When off,
                only friends and people you follow can see you. Change it
                anytime in Edit Profile.
              </div>
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

// ── ADMIN DASHBOARD (gated to profile.is_admin) ──────────────────────────────
function AdminPage({ onBack }) {
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({});
  const [users, setUsers] = useState([]);
  const [uq, setUq] = useState("");
  const [bugs, setBugs] = useState([]);
  const [fwd, setFwd] = useState({
    saved: 0,
    no_show: 0,
    error: 0,
    rate_limited: 0,
    confirm: 0,
    failures: [],
  });
  const [taste, setTaste] = useState({ artists: [], venues: [] });
  const [health, setHealth] = useState({ spotify: "…", places: "…" });
  const [growth, setGrowth] = useState({
    dau: 0,
    wau: 0,
    newWeek: 0,
    verified: 0,
    series: [],
    sources: [],
  });

  const load = async () => {
    setLoading(true);
    const today = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
    const [prof, con, fol, be, fe] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id,name,handle,location,total_shows,created_at,onboarded,last_active,forward_verified",
        )
        .order("created_at", { ascending: false }),
      supabase.from("concerts").select("artist,venue,date,source"),
      supabase.from("follows").select("follower_id", { count: "exact", head: true }),
      supabase
        .from("bug_reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(25),
      supabase
        .from("forward_events")
        .select("result,subject,created_at")
        .gte("created_at", weekAgo)
        .order("created_at", { ascending: false })
        .limit(1000),
    ]);
    const profs = prof.data || [];
    const cons = con.data || [];
    setUsers(profs);
    setCounts({
      users: profs.length,
      onboarded: profs.filter((p) => p.onboarded).length,
      shows: cons.length,
      upcoming: cons.filter((c) => c.date >= today).length,
      follows: fol.count || 0,
    });
    const t = {
      saved: 0,
      no_show: 0,
      error: 0,
      rate_limited: 0,
      confirm: 0,
      failures: [],
    };
    (fe.data || []).forEach((e) => {
      if (t[e.result] != null) t[e.result]++;
      if (e.result === "no_show" || e.result === "error") t.failures.push(e);
    });
    setFwd(t);
    setBugs(be.data || []);
    const tally = (arr, key) => {
      const m = {};
      arr.forEach((c) => {
        const v = (c[key] || "").trim();
        if (v) m[v] = (m[v] || 0) + 1;
      });
      return Object.entries(m)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);
    };
    setTaste({ artists: tally(cons, "artist"), venues: tally(cons, "venue") });

    // growth + engagement
    const now = Date.now();
    const dayMs = 864e5;
    const within = (ts, days) =>
      ts && now - new Date(ts).getTime() < days * dayMs;
    const series = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * dayMs).toISOString().slice(0, 10);
      series.push({
        d,
        n: profs.filter((p) => (p.created_at || "").slice(0, 10) === d).length,
      });
    }
    const sm = {};
    cons.forEach((c) => {
      const s = (c.source || "Other").trim() || "Other";
      sm[s] = (sm[s] || 0) + 1;
    });
    setGrowth({
      dau: profs.filter((p) => within(p.last_active, 1)).length,
      wau: profs.filter((p) => within(p.last_active, 7)).length,
      newWeek: profs.filter((p) => within(p.created_at, 7)).length,
      verified: profs.filter((p) => p.forward_verified).length,
      series,
      sources: Object.entries(sm).sort((a, b) => b[1] - a[1]),
    });
    setLoading(false);
    const ping = async (url) => {
      try {
        const r = await fetch(url);
        return r.ok ? "ok" : "err " + r.status;
      } catch (e) {
        return "down";
      }
    };
    setHealth({
      spotify: await ping("/.netlify/functions/spotify-artist-search?q=test"),
      places: await ping("/.netlify/functions/place-search?q=test"),
    });
  };

  useEffect(() => {
    load();
  }, []);

  const delUser = async (u) => {
    if (
      !window.confirm(
        "Delete " +
          (u.name || u.handle || "user") +
          "? This removes their profile and shows. Can't be undone.",
      )
    )
      return;
    await supabase.from("profiles").delete().eq("id", u.id);
    setUsers((p) => p.filter((x) => x.id !== u.id));
  };

  const shownUsers = users.filter((u) => {
    const q = uq.trim().toLowerCase();
    if (!q) return true;
    return ((u.name || "") + " " + (u.handle || "") + " " + (u.location || ""))
      .toLowerCase()
      .includes(q);
  });

  const card = {
    background: "#0c0c0c",
    border: "1px solid #1e1e1e",
    borderRadius: 10,
    padding: 16,
  };
  const sectionTitle = {
    fontFamily: "'DM Mono',monospace",
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#F5A623",
    margin: "26px 0 12px",
  };
  const mono = { fontFamily: "'DM Mono',monospace" };
  const pill = (state) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontFamily: "'DM Mono',monospace",
    fontSize: 12,
    color: state === "ok" ? "#5cc46a" : state === "…" ? "#888" : "#e0674f",
  });

  const Stat = ({ label, value, sub }) => (
    <div style={card}>
      <div
        style={{
          fontFamily: "'Bebas Neue',sans-serif",
          fontSize: 34,
          color: "#fff",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          ...mono,
          fontSize: 10,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          color: "#888",
          marginTop: 6,
        }}
      >
        {label}
      </div>
      {sub && (
        <div style={{ ...mono, fontSize: 10, color: "#555", marginTop: 2 }}>
          {sub}
        </div>
      )}
    </div>
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 210,
        background: "#070707",
        overflowY: "auto",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 18px 70px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 4,
          }}
        >
          <h1
            style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: 34,
              color: "#fff",
              letterSpacing: 1,
              margin: 0,
            }}
          >
            Admin
          </h1>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-sm" onClick={load} style={{ color: "#888" }}>
              ⟲ Refresh
            </button>
            <button className="btn-sm btn-amber" onClick={onBack}>
              Close
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ ...mono, color: "#666", padding: "40px 0" }}>
            Loading…
          </div>
        ) : (
          <>
            {/* COUNTS */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(112px,1fr))",
                gap: 10,
                marginTop: 16,
              }}
            >
              <Stat
                label="Users"
                value={counts.users}
                sub={counts.onboarded + " onboarded"}
              />
              <Stat label="Active today" value={growth.dau} />
              <Stat label="Active 7d" value={growth.wau} />
              <Stat label="New 7d" value={growth.newWeek} />
              <Stat
                label="Shows"
                value={counts.shows}
                sub={counts.upcoming + " upcoming"}
              />
              <Stat label="Follows" value={counts.follows} />
              <Stat label="Forwarding on" value={growth.verified} />
            </div>

            {/* SIGNUPS CHART */}
            <div style={sectionTitle}>Signups — last 30 days</div>
            <div
              style={{
                ...card,
                display: "flex",
                alignItems: "flex-end",
                gap: 2,
                height: 96,
              }}
            >
              {(() => {
                const max = Math.max(1, ...growth.series.map((p) => p.n));
                return growth.series.map((pt, i) => (
                  <div
                    key={i}
                    title={pt.d + ": " + pt.n}
                    style={{
                      flex: 1,
                      height: (pt.n / max) * 66 + 2,
                      minHeight: 2,
                      borderRadius: 2,
                      background: pt.n ? "#F5A623" : "#191919",
                    }}
                  />
                ));
              })()}
            </div>

            {/* SOURCE BREAKDOWN */}
            <div style={sectionTitle}>How shows get added</div>
            <div style={card}>
              {growth.sources.length === 0 ? (
                <div style={{ ...mono, fontSize: 11, color: "#555" }}>—</div>
              ) : (
                (() => {
                  const total =
                    growth.sources.reduce((a, [, x]) => a + x, 0) || 1;
                  return growth.sources.map(([s, n]) => (
                    <div
                      key={s}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "4px 0",
                      }}
                    >
                      <div style={{ width: 96, ...mono, fontSize: 11, color: "#aaa" }}>
                        {s}
                      </div>
                      <div
                        style={{
                          flex: 1,
                          height: 8,
                          background: "#141414",
                          borderRadius: 4,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: (n / total) * 100 + "%",
                            height: "100%",
                            background: "#F5A623",
                          }}
                        />
                      </div>
                      <div
                        style={{
                          ...mono,
                          fontSize: 11,
                          color: "#666",
                          width: 40,
                          textAlign: "right",
                        }}
                      >
                        {n}
                      </div>
                    </div>
                  ));
                })()
              )}
            </div>

            {/* HEALTH */}
            <div style={sectionTitle}>Health</div>
            <div style={{ ...card, display: "flex", gap: 24, flexWrap: "wrap" }}>
              <span style={pill(health.spotify)}>
                {health.spotify === "ok" ? "●" : "○"} Spotify proxy:{" "}
                {health.spotify}
              </span>
              <span style={pill(health.places)}>
                {health.places === "ok" ? "●" : "○"} Places proxy:{" "}
                {health.places}
              </span>
              <span style={pill("ok")}>● Supabase: ok</span>
            </div>

            {/* FORWARDING */}
            <div style={sectionTitle}>Forwarding — last 7 days</div>
            <div style={card}>
              <div
                style={{
                  display: "flex",
                  gap: 20,
                  flexWrap: "wrap",
                  marginBottom: fwd.failures.length ? 14 : 0,
                }}
              >
                {[
                  ["saved", "#5cc46a"],
                  ["no_show", "#e0a13f"],
                  ["error", "#e0674f"],
                  ["rate_limited", "#888"],
                  ["confirm", "#888"],
                ].map(([k, c]) => (
                  <div key={k}>
                    <span
                      style={{
                        fontFamily: "'Bebas Neue',sans-serif",
                        fontSize: 26,
                        color: c,
                      }}
                    >
                      {fwd[k]}
                    </span>
                    <span
                      style={{
                        ...mono,
                        fontSize: 10,
                        color: "#777",
                        marginLeft: 6,
                      }}
                    >
                      {k}
                    </span>
                  </div>
                ))}
              </div>
              {fwd.failures.length > 0 && (
                <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 10 }}>
                  <div
                    style={{ ...mono, fontSize: 10, color: "#888", marginBottom: 6 }}
                  >
                    RECENT FAILURES
                  </div>
                  {fwd.failures.slice(0, 8).map((f, i) => (
                    <div
                      key={i}
                      style={{
                        ...mono,
                        fontSize: 11,
                        color: "#aaa",
                        padding: "3px 0",
                      }}
                    >
                      <span
                        style={{
                          color: f.result === "error" ? "#e0674f" : "#e0a13f",
                        }}
                      >
                        [{f.result}]
                      </span>{" "}
                      {f.subject || "(no subject)"}{" "}
                      <span style={{ color: "#555" }}>· {timeAgo(f.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* BUG REPORTS */}
            <div style={sectionTitle}>Bug reports ({bugs.length})</div>
            <div style={card}>
              {bugs.length === 0 ? (
                <div style={{ ...mono, color: "#555", fontSize: 12 }}>
                  None yet.
                </div>
              ) : (
                bugs.map((b) => (
                  <div
                    key={b.id}
                    style={{
                      padding: "10px 0",
                      borderBottom: "1px solid #141414",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'Syne',sans-serif",
                        fontSize: 13,
                        color: "#ddd",
                      }}
                    >
                      {b.message}
                    </div>
                    <div style={{ ...mono, fontSize: 10, color: "#555", marginTop: 3 }}>
                      {timeAgo(b.created_at)}
                      {b.context && b.context.view
                        ? " · view:" + b.context.view
                        : ""}
                      {b.context && b.context.userAgent
                        ? " · " +
                          (/Mobi|iPhone|Android/i.test(b.context.userAgent)
                            ? "mobile"
                            : "desktop")
                        : ""}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* TASTE */}
            <div style={sectionTitle}>Top taste</div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              {[
                ["Artists", taste.artists],
                ["Venues", taste.venues],
              ].map(([label, list]) => (
                <div key={label} style={card}>
                  <div
                    style={{ ...mono, fontSize: 10, color: "#888", marginBottom: 8 }}
                  >
                    {label.toUpperCase()}
                  </div>
                  {list.length === 0 ? (
                    <div style={{ ...mono, fontSize: 11, color: "#555" }}>—</div>
                  ) : (
                    list.map(([name, n]) => (
                      <div
                        key={name}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontFamily: "'Syne',sans-serif",
                          fontSize: 12.5,
                          color: "#ccc",
                          padding: "2px 0",
                        }}
                      >
                        <span
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {name}
                        </span>
                        <span style={{ ...mono, color: "#666" }}>{n}</span>
                      </div>
                    ))
                  )}
                </div>
              ))}
            </div>

            {/* USERS */}
            <div style={sectionTitle}>Users ({users.length})</div>
            <input
              className="form-inp"
              placeholder="Search name, handle, city…"
              value={uq}
              onChange={(e) => setUq(e.target.value)}
              style={{ width: "100%", marginBottom: 10 }}
            />
            <div style={card}>
              {shownUsers.slice(0, 100).map((u) => (
                <div
                  key={u.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 0",
                    borderBottom: "1px solid #141414",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "'Syne',sans-serif",
                        fontSize: 13,
                        color: "#ddd",
                      }}
                    >
                      {u.name || "—"}{" "}
                      <span style={{ color: "#666" }}>@{u.handle}</span>
                      {!u.onboarded && (
                        <span style={{ color: "#e0a13f", fontSize: 10 }}>
                          {" "}
                          (not onboarded)
                        </span>
                      )}
                    </div>
                    <div style={{ ...mono, fontSize: 10, color: "#555" }}>
                      {u.location || "no location"} · joined{" "}
                      {timeAgo(u.created_at)}
                    </div>
                  </div>
                  <button
                    className="btn-sm"
                    onClick={() => delUser(u)}
                    style={{ color: "#e0674f", borderColor: "#3a1e1e" }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

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
          discoverable: !!pr.discoverable,
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
  const [showPast, setShowPast] = useState(false); // collapse past shows
  const [detail, setDetail] = useState(null);
  const [pushState, setPushState] = useState("loading"); // loading|prompt|granted|denied|unsupported|ios-install
  const [installPrompt, setInstallPrompt] = useState(null); // deferred beforeinstallprompt
  const [installHidden, setInstallHidden] = useState(false);
  const [pushHidden, setPushHidden] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [inboxTab, setInboxTab] = useState("messages");
  const [activeThread, setActiveThread] = useState(null); // other user's id
  const [shareShow, setShareShow] = useState(null); // concert being shared
  const [actFilter, setActFilter] = useState("all");
  const [crews, setCrews] = useState([]); // group threads (one per show)
  const [activeCrew, setActiveCrew] = useState(null);
  const [crewPrompt, setCrewPrompt] = useState(null);
  const [otcHidden, setOtcHidden] = useState(() => {
    try {
      return localStorage.getItem("encore_otc_nudge") === "1";
    } catch (e) {
      return false;
    }
  });
  const [showBug, setShowBug] = useState(false);
  const [bugText, setBugText] = useState("");
  const [bugSending, setBugSending] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [mailConnect, setMailConnect] = useState(false); // forwarding walkthrough overlay
  const [mailDismissed, setMailDismissed] = useState(false);
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

  // Detect push support + whether this browser is already subscribed.
  useEffect(() => {
    if (typeof navigator === "undefined") {
      setPushState("unsupported");
      return;
    }
    // iOS only allows push once the app lives on the home screen. Before that
    // the APIs simply aren't there, so tell them how to install instead of
    // silently showing nothing.
    if (isIOS() && !isStandalone()) {
      setPushState("ios-install");
      return;
    }
    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      typeof Notification === "undefined"
    ) {
      setPushState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setPushState("denied");
      return;
    }
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) =>
        setPushState(
          sub || Notification.permission === "granted" ? "granted" : "prompt",
        ),
      )
      .catch(() => setPushState("unsupported"));
  }, []);

  // Chrome/Edge/Brave fire this when the app is installable — stash it so we
  // can offer a one-tap Install button instead of making people dig in menus.
  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    const onInstalled = () => setInstallPrompt(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Live auto-popup: when a show is inserted (e.g. a forwarded ticket lands, or
  // another device adds one), slide it into the feed without a refresh.
  useEffect(() => {
    if (typeof supabase.channel !== "function") return;
    const ch = supabase
      .channel("concerts-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "concerts" },
        (payload) => {
          const c = payload.new;
          if (!c || !c.id) return;
          const mine = session?.user?.id && c.owner_id === session.user.id;
          setDbConcerts((p) =>
            p.some((x) => x.id === c.id)
              ? p
              : [...p, { ...c, attendees: mine ? [c.owner_id] : [] }],
          );
          if (mine) toast("🎟️ Added from your inbox — " + (c.artist || "show"));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [session]);

  // Load this user's notifications and keep the bell live.
  useEffect(() => {
    if (!session?.user?.id) {
      setNotifs([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      if (!cancelled && data) setNotifs(data);
    })();
    let ch;
    if (typeof supabase.channel === "function") {
      ch = supabase
        .channel("notifs-" + session.user.id)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: "user_id=eq." + session.user.id,
          },
          (payload) => {
            if (payload.new)
              setNotifs((p) =>
                p.some((n) => n.id === payload.new.id)
                  ? p
                  : [payload.new, ...p].slice(0, 30),
              );
          },
        )
        .subscribe();
    }
    return () => {
      cancelled = true;
      if (ch) supabase.removeChannel(ch);
    };
  }, [session]);

  // Load my messages and keep them live.
  useEffect(() => {
    if (!session?.user?.id) {
      setMsgs([]);
      return;
    }
    let cancelled = false;
    const uid = session.user.id;
    (async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or("sender_id.eq." + uid + ",recipient_id.eq." + uid)
        .order("created_at", { ascending: false })
        .limit(200);
      if (!cancelled && data) setMsgs(data);
    })();
    let mch;
    if (typeof supabase.channel === "function") {
      mch = supabase
        .channel("msgs-" + uid)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: "recipient_id=eq." + uid,
          },
          (payload) => {
            if (payload.new)
              setMsgs((p) =>
                p.some((m) => m.id === payload.new.id)
                  ? p
                  : [payload.new, ...p],
              );
          },
        )
        .subscribe();
    }
    return () => {
      cancelled = true;
      if (mch) supabase.removeChannel(mch);
    };
  }, [session]);

  // People I've blocked — their messages and requests disappear everywhere.
  const [myBlocks, setMyBlocks] = useState([]);
  useEffect(() => {
    if (!session?.user?.id) {
      setMyBlocks([]);
      return;
    }
    supabase
      .from("blocks")
      .select("blocked_id")
      .then(({ data }) => setMyBlocks((data || []).map((b) => b.blocked_id)));
  }, [session]);
  const blockUser = async (id) => {
    setMyBlocks((p) => (p.includes(id) ? p : [...p, id]));
    setActiveThread(null);
    await supabase
      .from("blocks")
      .insert({ blocker_id: session.user.id, blocked_id: id });
    toast("Blocked. They can't message you anymore.");
  };

  // Crew chats: RLS returns only crews I'm in or could join (I'm going).
  const loadCrews = async () => {
    if (!session?.user?.id) {
      setCrews([]);
      return;
    }
    const { data } = await supabase
      .from("threads")
      .select("*, thread_members(user_id, last_read_at)");
    if (data) setCrews(data);
  };
  useEffect(() => {
    loadCrews();
    if (!session?.user?.id || typeof supabase.channel !== "function") return;
    const ch = supabase
      .channel("crewbump-" + session.user.id)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "thread_messages" },
        (payload) => {
          if (payload.new)
            setCrews((p) =>
              p.map((t) =>
                t.id === payload.new.thread_id
                  ? { ...t, last_message_at: payload.new.created_at }
                  : t,
              ),
            );
        },
      )
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [session]);

  // Track "last active" for DAU/WAU (one lightweight write per app load).
  useEffect(() => {
    if (!session?.user?.id) return;
    supabase
      .from("profiles")
      .update({ last_active: new Date().toISOString() })
      .eq("id", session.user.id);
  }, [session]);

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
        onComplete={(p) => {
          setProfile(p);
          if (FORWARDING_ENABLED) setMailConnect(true);
        }}
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
        discoverable: !!profile.discoverable,
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
  const isAdmin = !!(profile && profile.is_admin);

  // Shared look for the inline banners above the feed.
  const bannerBox = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    background: "#111",
    border: "1px solid #1e1e1e",
    borderRadius: 8,
    padding: "12px 14px",
    marginBottom: 16,
  };
  const bannerTxt = {
    fontFamily: "'Syne',sans-serif",
    fontSize: 13,
    color: "#ccc",
    flex: 1,
    minWidth: 200,
    lineHeight: 1.45,
  };
  // Only ever show one banner at a time.
  const pushBannerShowing =
    !isGuest &&
    !pushHidden &&
    (pushState === "prompt" || pushState === "ios-install");
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

  // ── Inbox: unread counts, sending, read receipts ──
  const unreadMsgCount = msgs.filter(
    (m) =>
      m.recipient_id === session?.user?.id &&
      !m.read &&
      !myBlocks.includes(m.sender_id),
  ).length;
  const crewUnreadCount = crews.filter((t) => {
    const me = (t.thread_members || []).find(
      (m) => m.user_id === session?.user?.id,
    );
    return (
      me &&
      t.last_message_at &&
      new Date(t.last_message_at) > new Date(me.last_read_at)
    );
  }).length;

  const sendMessage = async (toId, body, show) => {
    if (!session?.user?.id) return false;
    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: session.user.id,
        recipient_id: toId,
        body: body || "",
        show: show || null,
      })
      .select()
      .single();
    if (error) {
      toast("Couldn't send — " + error.message, true);
      return false;
    }
    setMsgs((p) => [data, ...p]);
    return true;
  };

  const markThreadRead = async (otherId) => {
    if (!session?.user?.id) return;
    const unread = msgs.some(
      (m) => m.sender_id === otherId && !m.read && m.recipient_id === session.user.id,
    );
    if (!unread) return;
    setMsgs((p) =>
      p.map((m) => (m.sender_id === otherId && !m.read ? { ...m, read: true } : m)),
    );
    await supabase
      .from("messages")
      .update({ read: true })
      .eq("recipient_id", session.user.id)
      .eq("sender_id", otherId)
      .eq("read", false);
  };

  const openThread = (id) => {
    if (!requireAuth()) return;
    setInboxTab("messages");
    setActiveCrew(null);
    setActiveThread(id);
    markThreadRead(id);
    setShowNotifs(true);
  };

  // Activity items are marked read when that tab is viewed (see InboxSheet).
  const markNotifsRead = async () => {
    const unread = notifs.filter((n) => !n.read);
    if (unread.length && session?.user?.id) {
      setNotifs((p) => p.map((n) => ({ ...n, read: true })));
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", session.user.id)
        .eq("read", false);
    }
  };
  const markCrewRead = async (tid) => {
    if (!session?.user?.id) return;
    const now = new Date().toISOString();
    setCrews((p) =>
      p.map((t) =>
        t.id === tid
          ? {
              ...t,
              thread_members: (t.thread_members || []).map((m) =>
                m.user_id === session.user.id
                  ? { ...m, last_read_at: now }
                  : m,
              ),
            }
          : t,
      ),
    );
    await supabase
      .from("thread_members")
      .update({ last_read_at: now })
      .eq("thread_id", tid)
      .eq("user_id", session.user.id);
  };
  const crewForShow = (c) =>
    c
      ? crews.find(
          (t) => t.show_artist === c.artist && t.show_date === c.date,
        )
      : null;
  const startCrew = async (c) => {
    if (!requireAuth()) return;
    const { data, error } = await supabase
      .from("threads")
      .insert({
        show_artist: c.artist,
        show_date: c.date,
        venue: c.venue || "",
        city: c.city || "",
        created_by: session.user.id,
      })
      .select()
      .single();
    if (error) {
      toast("Couldn't start the crew — " + error.message, true);
      return;
    }
    await supabase
      .from("thread_members")
      .insert({ thread_id: data.id, user_id: session.user.id });
    await loadCrews();
    setDetail(null);
    openCrew(data.id);
  };
  const joinCrew = async (t) => {
    if (!requireAuth()) return;
    const { error } = await supabase
      .from("thread_members")
      .insert({ thread_id: t.id, user_id: session.user.id });
    if (error) {
      toast("Couldn't join — " + error.message, true);
      return;
    }
    await loadCrews();
    setDetail(null);
    openCrew(t.id);
  };
  const leaveCrew = async (tid) => {
    await supabase
      .from("thread_members")
      .delete()
      .eq("thread_id", tid)
      .eq("user_id", session.user.id);
    setActiveCrew(null);
    await loadCrews();
    toast("Left the crew.");
  };
  const openCrew = (tid) => {
    setInboxTab("messages");
    setActiveThread(null);
    setActiveCrew(tid);
    setShowNotifs(true);
  };
  const openNotifs = () => {
    setInboxTab(unreadMsgCount > 0 ? "messages" : "activity");
    setShowNotifs(true);
  };

  // Human-readable text for a notification row.
  const notifMsg = (n) => {
    const d = n.data || {};
    if (n.type === "forward_no_show")
      return {
        icon: "📭",
        text:
          "We got a forwarded email but couldn't read a show from it" +
          (d.subject ? " (“" + d.subject + "”)" : "."),
        action: "no_show",
      };
    if (n.type === "new_show")
      return {
        icon: "🎟️",
        text:
          (d.actor || "Someone you follow") +
          " added a show" +
          (d.artist ? " — " + d.artist : ""),
      };
    if (n.type === "taste_match")
      return {
        icon: "⚡",
        text:
          (d.artist || "A show") +
          " just got added — right up your alley" +
          (d.genres && d.genres[0] ? " (" + d.genres[0] + ")" : ""),
      };
    return { icon: "🔔", text: "New activity" };
  };

  // Submit a bug report with auto-captured context.
  const submitBug = async () => {
    if (!bugText.trim() || bugSending) return;
    setBugSending(true);
    try {
      await supabase.from("bug_reports").insert({
        user_id: session?.user?.id || null,
        message: bugText.trim(),
        context: {
          view,
          filter,
          isGuest,
          userAgent:
            typeof navigator !== "undefined" ? navigator.userAgent : "",
          url: typeof location !== "undefined" ? location.href : "",
          ts: new Date().toISOString(),
        },
      });
      setBugText("");
      setShowBug(false);
      toast("Thanks — your report was sent. 🐛");
    } catch (e) {
      toast("Couldn't send the report — try again.", true);
    } finally {
      setBugSending(false);
    }
  };

  // Ask permission, subscribe, and save the subscription to Supabase.
  const enablePush = async () => {
    if (!session?.user?.id) return;
    if (VAPID_PUBLIC_KEY === "YOUR_VAPID_PUBLIC_KEY_HERE") {
      toast("Push isn't configured yet.", true);
      return;
    }
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setPushState(perm === "denied" ? "denied" : "prompt");
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      const j = sub.toJSON();
      await supabase.from("push_subscriptions").upsert(
        {
          user_id: session.user.id,
          endpoint: j.endpoint,
          p256dh: j.keys.p256dh,
          auth: j.keys.auth,
        },
        { onConflict: "endpoint" },
      );
      setPushState("granted");
      toast("Notifications on! 🔔");
    } catch (e) {
      setPushState("prompt");
      // Brave disables web push unless the user turns it on themselves — say so
      // rather than showing a dead-end error.
      if (await isBrave()) {
        toast(
          "Brave blocks push by default. Open brave://settings/privacy, turn on “Use Google services for push messaging,” restart Brave, then try again.",
          true,
        );
      } else {
        toast("Couldn't enable notifications.", true);
      }
    }
  };

  const doInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    try {
      await installPrompt.userChoice;
    } catch (e) {
      /* dismissed */
    }
    setInstallPrompt(null);
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
  const toggleGoing = (cid) => {
    const c = liveConcerts.find((x) => x.id === cid);
    const wasGoing = c && (c.attendees || []).includes(curUser.id);
    toggleAttendee(cid, curUser.id);
    // Just marked going + this show has a crew I'm not in → suggest it.
    if (c && !wasGoing) {
      const t = crewForShow(c);
      if (
        t &&
        !(t.thread_members || []).some((m) => m.user_id === curUser.id)
      )
        setCrewPrompt(t);
    }
  };
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
          discoverable: !!draft.discoverable,
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
  // Open to Connect nudge: shown on the feed once someone has 3+ shows.
  const dismissOtc = () => {
    setOtcHidden(true);
    try {
      localStorage.setItem("encore_otc_nudge", "1");
    } catch (e) {
      /* private mode */
    }
  };
  const enableOtc = async () => {
    dismissOtc();
    await supabase
      .from("profiles")
      .update({ discoverable: true })
      .eq("id", session.user.id);
    setProfile((p) => ({ ...p, discoverable: true }));
    toast("You're open to connect 🔓");
  };

  // Per-show privacy: hidden shows are owner-only (enforced by RLS too).
  const toggleHidden = async (c) => {
    const v = !c.hidden;
    setDbConcerts((p) =>
      p.map((x) => (x.id === c.id ? { ...x, hidden: v } : x)),
    );
    setDetail((d) => (d && d.id === c.id ? { ...d, hidden: v } : d));
    await supabase.from("concerts").update({ hidden: v }).eq("id", c.id);
    toast(v ? "Going quietly 🤫" : "Show visible again 👁");
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

  const clearMyShows = async () => {
    if (!requireAuth()) return;
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
  const upcomingF = filtered.filter((c) => daysUntil(c.date) >= 0);
  const pastF = filtered
    .filter((c) => daysUntil(c.date) < 0)
    .sort((a, b) => new Date(b.date) - new Date(a.date)); // most recent first
  const grouped = [...upcomingF]
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
                  <button
                    className="icon-btn"
                    onClick={openNotifs}
                    title="Notifications"
                    style={{ position: "relative" }}
                  >
                    🔔
                    {(notifs.some((n) => !n.read) ||
                      unreadMsgCount + crewUnreadCount > 0) && (
                      <span
                        style={{
                          position: "absolute",
                          top: -3,
                          right: -3,
                          minWidth: 15,
                          height: 15,
                          padding: "0 3px",
                          borderRadius: 8,
                          background: "#F5A623",
                          color: "#000",
                          fontSize: 9,
                          fontWeight: 700,
                          fontFamily: "'DM Mono',monospace",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          lineHeight: 1,
                        }}
                      >
                        {(() => {
                          const u =
                            notifs.filter((n) => !n.read).length +
                            unreadMsgCount +
                            crewUnreadCount;
                          return u > 9 ? "9+" : u;
                        })()}
                      </span>
                    )}
                  </button>
                  <div
                    className="my-avatar"
                    style={{ background: curUser.color }}
                    onClick={() => viewProfile(curUser.id)}
                    title="My profile"
                  >
                    {curUser.name.slice(0, 2).toUpperCase()}
                  </div>
                  {isAdmin && (
                    <button
                      className="icon-btn"
                      onClick={() => setShowAdmin(true)}
                      title="Admin"
                    >
                      ⚙
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      // Hard redirect: guarantees clean state instead of the
                      // app re-rendering stale views with no session.
                      window.location.href = "/";
                    }}
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
              onMessage={openThread}
              onGenreClick={openGenre}
              onArtistClick={openArtist}
            />
          )}
          {view === "edit" && (
            <EditProfilePage
              user={curUser}
              onBack={() => setView("profile")}
              onSave={saveProfile}
              onClearShows={clearMyShows}
              showCount={
                liveConcerts.filter((c) => c.owner_id === curUser.id).length
              }
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
              onGenreClick={openGenre}
            />
          )}
          {view === "feed" && (
            <main className="main">
              {notif && <div className="toast-ok">🔔 {notif}</div>}
              {errMsg && <div className="toast-err">⚠ {errMsg}</div>}
              {!isGuest && pushState === "ios-install" && !pushHidden && (
                <div style={bannerBox}>
                  <span style={bannerTxt}>
                    {isIOSNonSafari()
                      ? "🔔 To get show alerts on iPhone, open encorefriends.com in Safari, then tap Share → Add to Home Screen."
                      : "🔔 Want a ping when friends add a show? Tap Share, then “Add to Home Screen” — iPhone only sends alerts to installed apps."}
                  </span>
                  <button
                    className="btn-sm"
                    onClick={() => setPushHidden(true)}
                    style={{ color: "#777" }}
                  >
                    Got it
                  </button>
                </div>
              )}
              {!isGuest &&
                !curUser.discoverable &&
                !otcHidden &&
                liveConcerts.filter((c) =>
                  (c.attendees || []).includes(curUser.id),
                ).length >= 3 && (
                  <div
                    style={{
                      background: "rgba(245,166,35,.05)",
                      border: "1px solid rgba(245,166,35,.25)",
                      borderRadius: 10,
                      padding: "13px 15px",
                      marginBottom: 14,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Syne',sans-serif",
                        fontSize: 13,
                        color: "#f0ede8",
                        flex: 1,
                        minWidth: 220,
                      }}
                    >
                      🔓 You've got{" "}
                      {
                        liveConcerts.filter((c) =>
                          (c.attendees || []).includes(curUser.id),
                        ).length
                      }{" "}
                      shows tracked. Open your profile and find the people who
                      go to the same ones.
                    </span>
                    <button
                      onClick={enableOtc}
                      style={{
                        background: "#F5A623",
                        border: "none",
                        color: "#000",
                        padding: "7px 13px",
                        borderRadius: 6,
                        fontFamily: "'DM Mono',monospace",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Open to Connect
                    </button>
                    <button
                      onClick={dismissOtc}
                      style={{
                        background: "none",
                        border: "1px solid #2a2a2a",
                        color: "#666",
                        padding: "7px 11px",
                        borderRadius: 6,
                        fontFamily: "'DM Mono',monospace",
                        fontSize: 11,
                        cursor: "pointer",
                      }}
                    >
                      Not now
                    </button>
                  </div>
                )}
              {!isGuest && pushState === "prompt" && !pushHidden && (
                <div style={bannerBox}>
                  <span style={bannerTxt}>
                    🔔 Get a ping when people you follow add a show.
                  </span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn-sm btn-amber" onClick={enablePush}>
                      Enable
                    </button>
                    {installPrompt && (
                      <button className="btn-sm" onClick={doInstall}>
                        Install app
                      </button>
                    )}
                    <button
                      className="btn-sm"
                      onClick={() => setPushHidden(true)}
                      style={{ color: "#777" }}
                    >
                      Not now
                    </button>
                  </div>
                </div>
              )}
              {!isGuest &&
                installPrompt &&
                !installHidden &&
                !pushBannerShowing && (
                  <div style={bannerBox}>
                    <span style={bannerTxt}>
                      📲 Install Encore for quicker access and reliable alerts.
                    </span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn-sm btn-amber" onClick={doInstall}>
                        Install
                      </button>
                      <button
                        className="btn-sm"
                        onClick={() => setInstallHidden(true)}
                        style={{ color: "#777" }}
                      >
                        Not now
                      </button>
                    </div>
                  </div>
                )}
              {FORWARDING_ENABLED &&
                !isGuest &&
                !profile?.forward_verified &&
                !mailDismissed &&
                !pushBannerShowing && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                      background: "#111",
                      border: "1px solid #1e1e1e",
                      borderRadius: 8,
                      padding: "12px 14px",
                      marginBottom: 16,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Syne',sans-serif",
                        fontSize: 13,
                        color: "#ccc",
                      }}
                    >
                      📥 Add your shows automatically from email — about a
                      minute to set up.
                    </span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="btn-sm btn-amber"
                        onClick={() => setMailConnect(true)}
                      >
                        Set up
                      </button>
                      <button
                        className="btn-sm"
                        onClick={() => setMailDismissed(true)}
                        style={{ color: "#777" }}
                      >
                        Not now
                      </button>
                    </div>
                  </div>
                )}
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
                    Add a show manually, or forward a ticket to track it
                    automatically.
                  </div>
                </div>
              ) : filtered.length === 0 ? (
                <div className="empty">
                  <div className="empty-i">🎫</div>
                  <div className="empty-t">No Shows Here</div>
                </div>
              ) : (
                <>
                  {Object.values(grouped).map(({ l, items }) => (
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
                            onGenreClick={openGenre}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                  {Object.keys(grouped).length === 0 && pastF.length > 0 && (
                    <div className="empty">
                      <div className="empty-i">✓</div>
                      <div className="empty-t">Nothing upcoming</div>
                    </div>
                  )}
                  {pastF.length > 0 && (
                    <div className="sec">
                      <div
                        onClick={() => setShowPast((s) => !s)}
                        style={{
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          color: "#666",
                          fontFamily: "'DM Mono',monospace",
                          fontSize: 11,
                          letterSpacing: 2,
                          textTransform: "uppercase",
                          margin: "28px 0 14px",
                        }}
                      >
                        {showPast ? "▾" : "▸"} Past shows ({pastF.length})
                      </div>
                      {showPast && (
                        <div className="grid">
                          {pastF.map((c) => (
                            <CCard
                              key={c.id}
                              c={c}
                              users={users}
                              curUser={curUser}
                              onOpen={setDetail}
                              onToggleGoing={toggleGoing}
                              onViewProfile={viewProfile}
                              onDelete={deleteConcert}
                              onGenreClick={openGenre}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </main>
          )}
        </div>
      </div>

      {/* SCAN OVERLAY */}
      {FORWARDING_ENABLED && mailConnect && (
        <MailConnect
          session={session}
          profile={profile}
          onTokenReady={(t) =>
            setProfile((p) => ({ ...(p || {}), forward_token: t }))
          }
          onClose={() => setMailConnect(false)}
        />
      )}

      {/* NOTIFICATIONS PANEL */}
      {showNotifs && (
        <InboxSheet
          curUser={curUser}
          users={users}
          msgs={msgs}
          notifs={notifs}
          notifMsg={notifMsg}
          tab={inboxTab}
          setTab={setInboxTab}
          activeThread={activeThread}
          setActiveThread={(id) => {
            setActiveCrew(null);
            setActiveThread(id);
            if (id) markThreadRead(id);
          }}
          crews={crews}
          activeCrew={activeCrew}
          setActiveCrew={setActiveCrew}
          onLeaveCrew={leaveCrew}
          onCrewRead={markCrewRead}
          actFilter={actFilter}
          setActFilter={setActFilter}
          onSend={sendMessage}
          onClose={() => {
            setShowNotifs(false);
            setActiveThread(null);
            setActiveCrew(null);
          }}
          onViewProfile={(id) => {
            setShowNotifs(false);
            viewProfile(id);
          }}
          onReportBug={() => {
            setShowNotifs(false);
            setShowBug(true);
          }}
          onMarkActivityRead={markNotifsRead}
          myBlocks={myBlocks}
          onBlock={blockUser}
        />
      )}

      {/* BUG REPORT */}
      {showBug && (
        <div className="mwrap" onClick={() => setShowBug(false)}>
          <div
            className="sheet"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 460 }}
          >
            <div className="sheet-bar" style={{ background: "#F5A623" }} />
            <div style={{ padding: "10px 18px 22px" }}>
              <div
                style={{
                  fontFamily: "'Bebas Neue',sans-serif",
                  fontSize: 24,
                  color: "#fff",
                  letterSpacing: 1,
                  marginBottom: 6,
                }}
              >
                Report a bug
              </div>
              <div
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontSize: 12.5,
                  color: "#888",
                  marginBottom: 12,
                  lineHeight: 1.5,
                }}
              >
                Hit something weird? Tell us what happened — we grab the
                technical details automatically.
              </div>
              <textarea
                value={bugText}
                onChange={(e) => setBugText(e.target.value)}
                placeholder="What went wrong, and what were you doing?"
                rows={5}
                className="form-inp"
                style={{
                  width: "100%",
                  resize: "vertical",
                  fontFamily: "'Syne',sans-serif",
                }}
              />
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 12,
                  justifyContent: "flex-end",
                }}
              >
                <button
                  className="btn-sm"
                  onClick={() => setShowBug(false)}
                  style={{ color: "#888" }}
                >
                  Cancel
                </button>
                <button
                  className="btn-sm btn-amber"
                  onClick={submitBug}
                  disabled={bugSending || !bugText.trim()}
                >
                  {bugSending ? "Sending…" : "Send report"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAdmin && showAdmin && (
        <AdminPage onBack={() => setShowAdmin(false)} />
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
                <ArtistSearch
                  value={nc.artist ? [nc.artist] : []}
                  max={1}
                  placeholder="Search artist…"
                  onChange={(a) => setNc((p) => ({ ...p, artist: a[0] || "" }))}
                />
              </div>
              <div className="form-row">
                <div className="form-lbl">Venue &amp; City</div>
                <PlaceSearch
                  placeholder="Search venue or address…"
                  onPick={(pl) =>
                    setNc((p) => ({
                      ...p,
                      venue: pl.venue || p.venue,
                      city: pl.city || p.city,
                    }))
                  }
                />
                <div className="form-grid" style={{ marginTop: 8 }}>
                  <input
                    className="form-inp"
                    placeholder="Venue"
                    value={nc.venue}
                    onChange={(e) =>
                      setNc((p) => ({ ...p, venue: e.target.value }))
                    }
                  />
                  <input
                    className="form-inp"
                    placeholder="City, State"
                    value={nc.city}
                    onChange={(e) =>
                      setNc((p) => ({ ...p, city: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-lbl">Date *</div>
                <DatePicker
                  value={nc.date}
                  onChange={(d) => setNc((p) => ({ ...p, date: d }))}
                />
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
          onGenreClick={(g) => {
            setDetail(null);
            openGenre(g);
          }}
          onShare={(cc) => setShareShow(cc)}
          onToggleHidden={toggleHidden}
          crew={crewForShow(detail)}
          onStartCrew={startCrew}
          onJoinCrew={joinCrew}
          onOpenCrew={openCrew}
        />
      )}
      {shareShow && (
        <SharePicker
          c={shareShow}
          users={users}
          curUser={curUser}
          onClose={() => setShareShow(null)}
          onSend={async (uid) => {
            const okd = await sendMessage(uid, "", {
              artist: shareShow.artist,
              venue: shareShow.venue || "",
              city: shareShow.city || "",
              date: shareShow.date,
            });
            if (okd) {
              const u2 = users.find((x) => x.id === uid);
              toast("Shared with " + (u2 ? u2.name : "friend") + " 🎟");
            }
            setShareShow(null);
          }}
        />
      )}
      {crewPrompt && (
        <div
          style={{
            position: "fixed",
            bottom: 18,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 800,
            background: "#141414",
            border: "1px solid rgba(245,166,35,.35)",
            borderRadius: 10,
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: "0 8px 30px rgba(0,0,0,.6)",
            maxWidth: "92vw",
          }}
        >
          <span style={{ fontSize: 16 }}>👥</span>
          <span
            style={{
              fontFamily: "'Syne',sans-serif",
              fontSize: 13,
              color: "#f0ede8",
            }}
          >
            {(crewPrompt.thread_members || []).length} in the crew for{" "}
            {crewPrompt.show_artist} — join them?
          </span>
          <button
            onClick={() => {
              const t = crewPrompt;
              setCrewPrompt(null);
              joinCrew(t);
            }}
            style={{
              background: "#F5A623",
              border: "none",
              color: "#000",
              padding: "7px 13px",
              borderRadius: 6,
              fontFamily: "'DM Mono',monospace",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Join
          </button>
          <button
            onClick={() => setCrewPrompt(null)}
            style={{
              background: "none",
              border: "1px solid #2a2a2a",
              color: "#666",
              padding: "7px 11px",
              borderRadius: 6,
              fontFamily: "'DM Mono',monospace",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            Not now
          </button>
        </div>
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
