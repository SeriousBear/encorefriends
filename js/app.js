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
  "House",
  "Techno",
  "Bass",
  "Trance",
  "DnB",
  "Dubstep",
  "EDM",
  "Ambient",
  "Breaks",
  "Garage",
  "Industrial",
  "Minimal",
  "Progressive",
  "Big Room",
  "Deep House",
  "Tech House",
  "UK Garage",
  "Jungle",
  "Footwork",
  "Tribal",
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

// ── DEMO DATA ────────────────────────────────────────────────────────────────
// Upcoming EDM shows with real ticket links
const INIT_CONCERTS = [
  {
    id: 1,
    artist: "deadmau5",
    venue: "XS Nightclub at Wynn Las Vegas",
    city: "Las Vegas, NV",
    date: "2026-04-25",
    source: "Ticketmaster",
    ticketUrl: "https://www.ticketmaster.com/deadmau5-tickets/artist/1221074",
    genres: ["Techno", "House", "Progressive"],
  },
  {
    id: 2,
    artist: "Subtronics",
    venue: "Red Rocks Amphitheatre",
    city: "Morrison, CO",
    date: "2026-04-23",
    source: "Ticketmaster",
    ticketUrl: "https://www.ticketmaster.com/event/1C006241A9FD3AB6",
    genres: ["Bass", "Dubstep"],
  },
  {
    id: 3,
    artist: "Subtronics",
    venue: "Red Rocks Amphitheatre",
    city: "Morrison, CO",
    date: "2026-04-24",
    source: "Ticketmaster",
    ticketUrl: "https://www.ticketmaster.com/subtronics-tickets/artist/2359181",
    genres: ["Bass", "Dubstep"],
  },
  {
    id: 4,
    artist: "John Summit",
    venue: "LIV Nightclub",
    city: "Las Vegas, NV",
    date: "2026-05-01",
    source: "Ticketmaster",
    ticketUrl:
      "https://www.ticketmaster.com/john-summit-tickets/artist/2730221",
    genres: ["House", "Tech House"],
  },
  {
    id: 5,
    artist: "John Summit",
    venue: "LIV Nightclub Miami",
    city: "Miami Beach, FL",
    date: "2026-05-02",
    source: "Ticketmaster",
    ticketUrl:
      "https://www.ticketmaster.com/john-summit-tickets/artist/2730221",
    genres: ["House", "Tech House"],
  },
  {
    id: 6,
    artist: "deadmau5",
    venue: "XS Nightclub at Wynn Las Vegas",
    city: "Las Vegas, NV",
    date: "2026-05-08",
    source: "Ticketmaster",
    ticketUrl: "https://www.ticketmaster.com/deadmau5-tickets/artist/1221074",
    genres: ["Techno", "House"],
  },
  {
    id: 7,
    artist: "John Summit",
    venue: "EDC Las Vegas",
    city: "Las Vegas, NV",
    date: "2026-05-15",
    source: "Ticketmaster",
    ticketUrl:
      "https://www.ticketmaster.com/john-summit-tickets/artist/2730221",
    genres: ["House", "EDM"],
  },
  {
    id: 8,
    artist: "Subtronics b2b GRiZ",
    venue: "Gorge Amphitheatre",
    city: "George, WA",
    date: "2026-05-23",
    source: "Ticketmaster",
    ticketUrl: "https://www.ticketmaster.com/subtronics-tickets/artist/2359181",
    genres: ["Bass", "DnB", "Breaks"],
  },
  {
    id: 9,
    artist: "deadmau5",
    venue: "XS Nightclub at Wynn Las Vegas",
    city: "Las Vegas, NV",
    date: "2026-06-27",
    source: "Ticketmaster",
    ticketUrl: "https://www.ticketmaster.com/deadmau5-tickets/artist/1221074",
    genres: ["Techno", "House"],
  },
];

// Past shows (fixed history — not editable by demo)
const PAST_SHOWS = [
  {
    id: "p1",
    artist: "Fred Again..",
    venue: "Madison Square Garden",
    city: "New York, NY",
    date: "2026-01-15",
  },
  {
    id: "p2",
    artist: "Fisher",
    venue: "Avant Gardner",
    city: "Brooklyn, NY",
    date: "2026-02-08",
  },
  {
    id: "p3",
    artist: "Eric Prydz",
    venue: "Marquee NYC",
    city: "New York, NY",
    date: "2026-03-01",
  },
  {
    id: "p4",
    artist: "Subtronics",
    venue: "Terminal 5",
    city: "New York, NY",
    date: "2026-03-14",
  },
  {
    id: "p5",
    artist: "John Summit",
    venue: "Club Space",
    city: "Miami, FL",
    date: "2026-03-22",
  },
  {
    id: "p6",
    artist: "Rezz",
    venue: "Brooklyn Mirage",
    city: "Brooklyn, NY",
    date: "2026-03-29",
  },
  {
    id: "p7",
    artist: "Skrillex",
    venue: "Brooklyn Mirage",
    city: "Brooklyn, NY",
    date: "2026-02-14",
  },
  {
    id: "p8",
    artist: "Dom Dolla",
    venue: "Elsewhere",
    city: "Brooklyn, NY",
    date: "2026-01-31",
  },
  {
    id: "p9",
    artist: "Peggy Gou",
    venue: "Elsewhere",
    city: "Brooklyn, NY",
    date: "2026-02-21",
  },
  {
    id: "p10",
    artist: "deadmau5",
    venue: "XS Nightclub",
    city: "Las Vegas, NV",
    date: "2026-01-24",
  },
];

// Users — id 0 = current logged-in user
const INIT_USERS = [
  {
    id: 0,
    name: "Kyle",
    handle: "kyle",
    color: "#F5A623",
    location: "New York, NY",
    bio: "Chasing bass drops and big rooms since 2017.",
    genres: ["House", "Bass", "Techno"],
    following: [1, 2, 3],
    upcoming: [2, 5, 7],
    past: ["p2", "p3", "p5", "p6"],
    ratings: { p2: 5, p3: 5, p5: 4, p6: 5 },
    artists: ["Subtronics", "John Summit", "Rezz"],
    bucketList: ["Eric Prydz", "Solomun", "Four Tet"],
    vibe: "both",
    totalShows: 47,
    social: { instagram: "kyle.shows", spotify: "", soundcloud: "" },
  },
  {
    id: 1,
    name: "Alex",
    handle: "alexr",
    color: "#E85D3A",
    location: "Brooklyn, NY",
    bio: "If it goes below 128 BPM I'm not interested.",
    genres: ["Techno", "House", "DnB"],
    following: [0, 2, 4],
    upcoming: [2, 3, 8],
    past: ["p1", "p4", "p7", "p8"],
    ratings: { p1: 4, p4: 5, p7: 5, p8: 3 },
  },
  {
    id: 2,
    name: "Jordan",
    handle: "jordanm",
    color: "#9B6BF5",
    location: "Chicago, IL",
    bio: "Main stage devotee. All genres welcome.",
    genres: ["EDM", "Trance", "Bass"],
    following: [0, 1, 3],
    upcoming: [1, 4, 7],
    past: ["p1", "p2", "p5", "p9"],
    ratings: { p1: 5, p2: 4, p5: 5, p9: 4 },
  },
  {
    id: 3,
    name: "Sam",
    handle: "sammyb",
    color: "#2ECC71",
    location: "Los Angeles, CA",
    bio: "West coast bass music evangelist.",
    genres: ["Bass", "Dubstep", "DnB"],
    following: [0, 2, 5],
    upcoming: [3, 5, 8],
    past: ["p4", "p6", "p7", "p10"],
    ratings: { p4: 4, p6: 5, p7: 4, p10: 3 },
  },
  {
    id: 4,
    name: "Priya",
    handle: "priyak",
    color: "#E91E8C",
    location: "San Francisco, CA",
    bio: "Deep house and late nights. No bad vibes.",
    genres: ["House", "Garage", "Ambient"],
    following: [2, 5, 6],
    upcoming: [4, 6, 9],
    past: ["p2", "p3", "p8", "p9"],
    ratings: { p2: 5, p3: 5, p8: 4, p9: 5 },
  },
  {
    id: 5,
    name: "Marcus",
    handle: "marcusd",
    color: "#3498DB",
    location: "Miami, FL",
    bio: "Ultra regular. Club Space is my second home.",
    genres: ["Techno", "House", "Trance"],
    following: [3, 4, 6],
    upcoming: [5, 7, 9],
    past: ["p1", "p5", "p10"],
    ratings: { p1: 4, p5: 5, p10: 4 },
  },
  {
    id: 6,
    name: "Leila",
    handle: "leila_e",
    color: "#1ABC9C",
    location: "New York, NY",
    bio: "Vinyl collector. Boutique raves over festivals.",
    genres: ["Techno", "Breaks", "Ambient"],
    following: [4, 5],
    upcoming: [1, 3, 8],
    past: ["p3", "p6", "p9"],
    ratings: { p3: 5, p6: 4, p9: 5 },
  },
  {
    id: 7,
    name: "Darius",
    handle: "dariush",
    color: "#F39C12",
    location: "Detroit, MI",
    bio: "Techno roots, global travels.",
    genres: ["Techno", "House", "DnB"],
    following: [1, 6],
    upcoming: [2, 4, 6],
    past: ["p2", "p7", "p8", "p10"],
    ratings: { p2: 4, p7: 5, p8: 4, p10: 3 },
  },
];

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
const primaryUrl = (c) =>
  c.ticketUrl || "https://www.ticketmaster.com/search?q=" + enc(c.artist);
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
    tc.callback = (r) => (r.error ? rej(r) : res(r.access_token));
    tc.requestAccessToken({ prompt: "consent" });
  });

  setPr(10);
  setSt("Searching inbox…");

  // Multiple search passes to maximize coverage across ALL ticket platforms
  const searches = [
    // Major platforms by sender domain
    "from:(ticketmaster.com OR seatgeek.com OR axs.com OR dice.fm OR etix.com OR tixr.com OR vividseats.com OR tickpick.com OR showclix.com)",
    // More platforms including RA
    "from:(livenation.com OR eventbrite.com OR eventbritemail.com OR frontgatetickets.com OR universe.com OR bandsintown.com OR ra.co OR residentadvisor.net OR ticketweb.com OR eventim.com)",
    // RA specific — catches after-parties, club nights
    "from:(ra.co OR residentadvisor.net)",
    // Subject line patterns — catches any sender including venues and promoters
    'subject:("your tickets" OR "ticket confirmation" OR "e-ticket" OR "order confirmation") (concert OR show OR festival OR tour OR live OR venue OR party OR event)',
    // Broader subject patterns — after-parties, club nights, raves
    'subject:("you\'re going" OR "booking confirmation" OR "your order" OR "your booking") (ticket OR artist OR venue OR show OR festival OR party OR rave OR club)',
    // Receipt-style from ANY sender — catches small venues and local promoters
    "subject:(receipt OR confirmation) (ticket OR admission OR pass OR entry) (concert OR show OR festival OR tour OR party OR event)",
    // Wide net — any ticket-related email in last 2 years
    "subject:(ticket OR tickets) (artist OR venue OR festival OR show OR concert OR party OR rave OR tour) newer_than:2y",
  ];

  // Run all searches and deduplicate by message id
  const seen = new Set();
  const allMsgs = [];
  for (let s = 0; s < searches.length; s++) {
    setPr(10 + Math.round((s / searches.length) * 25));
    try {
      const res = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages?q=" +
          enc(searches[s]) +
          "&maxResults=30",
        { headers: { Authorization: "Bearer " + token } },
      );
      const data = await res.json();
      for (const msg of data.messages || []) {
        if (!seen.has(msg.id)) {
          seen.add(msg.id);
          allMsgs.push(msg);
        }
      }
    } catch (e) {
      /* skip failed searches */
    }
  }

  setPr(35);
  setSt("Reading " + allMsgs.length + " emails…");

  // Fetch full snippets for top 50 unique emails
  const bodies = [];
  const toFetch = allMsgs.slice(0, 50);
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
      bodies.push(
        "From: " +
          from +
          "\nSubject: " +
          subj +
          "\nDate: " +
          date +
          "\nSnippet: " +
          (m.snippet || ""),
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
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      system: `You are an expert concert ticket email parser. Extract every concert/show/festival/event from these emails.
Be thorough — parse ticket confirmations from ANY ticketing platform, venue, or promoter.
Look for: artist/performer name, venue, city, date, and which service the ticket was from.
Return ONLY a valid JSON array. Each object must have exactly:
{"artist": string, "venue": string, "city": string, "date": "YYYY-MM-DD", "source": string, "ticket_url": ""}
- artist: the performer/band/DJ name
- venue: the venue or festival name
- city: "City, State" format
- date: exact date in YYYY-MM-DD format — skip if you cannot determine a specific date
- source: the ticketing platform (Ticketmaster, SeatGeek, Eventbrite, AXS, DICE, StubHub, Direct, etc.)
- ticket_url: leave as empty string ""
Deduplicate — if you see the same show twice, include it once.
Return [] if no concert events found.`,
      messages: [{ role: "user", content: bodies.join("\n\n---EMAIL---\n\n") }],
    }),
  });

  const d = await ai.json();
  const t = (d.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
  const match = t.match(/\[[\s\S]*\]/);
  if (!match) return [];

  const parsed = JSON.parse(match[0]);
  setPr(92);
  setSt("Saving to your account…");

  // Save to Supabase if we have a userId
  const saved = [];
  if (userId) {
    for (const c of parsed) {
      try {
        const { data, error } = await supabase
          .from("concerts")
          .insert({
            owner_id: userId,
            artist: c.artist,
            venue: c.venue || "",
            city: c.city || "",
            date: c.date,
            source: c.source || "Unknown",
            ticket_url: c.ticket_url || "",
            genres: [],
          })
          .select()
          .single();
        if (data) {
          // Also add as attendee
          await supabase.from("concert_attendees").insert({
            concert_id: data.id,
            user_id: userId,
          });
          saved.push({ ...data, attendees: [userId] });
        }
      } catch (e) {
        /* skip duplicates */
      }
    }
    return saved;
  }

  // Fallback — return without saving
  return parsed.map((c, i) => ({ ...c, id: Date.now() + i, attendees: [0] }));
}

// ── CONCERT CARD ─────────────────────────────────────────────────────────────
function CCard({ c, users, curUser, onOpen, onToggleGoing, onViewProfile }) {
  const d = fmt(c.date),
    u = getUrgency(c.date),
    dy = daysUntil(c.date);
  const cc = u === "urgent" ? "card-u" : u === "soon" ? "card-s" : "card-n";
  const going = c.attendees?.includes(curUser.id);
  return (
    <div className={"card " + cc} onClick={() => onOpen(c)}>
      <div className="cbar" style={{ background: uColor(u) }} />
      <div className="cbody">
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
            <div className="ddw">{d.dow}</div>
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
  return (
    <div className="mwrap" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-bar" style={{ background: uColor(u) }} />
        <div className="sheet-handle" />
        <div className="sheet-body">
          <div className="sh-artist">{c.artist}</div>
          <div className="sh-venue">{c.venue}</div>
          <div className="sh-date">
            {c.city} · {d.dow}, {d.full}
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
          <a
            className="sh-buy"
            href={primaryUrl(c)}
            target="_blank"
            rel="noreferrer"
          >
            <span>
              Buy on {c.source !== "Direct" ? c.source : "Ticketmaster"}
            </span>
            <span className="sh-buy-src">Official ↗</span>
          </a>
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
                    <a
                      className="art-show-btn"
                      href={
                        c.ticketUrl ||
                        "https://www.ticketmaster.com/search?q=" +
                          encodeURIComponent(c.artist)
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      Tickets ↗
                    </a>
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
                      <a
                        href={
                          c.ticketUrl ||
                          "https://www.ticketmaster.com/search?q=" +
                            encodeURIComponent(c.artist)
                        }
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
function LoginPage() {
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
        <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 16 }}>
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
function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [dbConcerts, setDbConcerts] = useState([]);

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
      .single()
      .then(({ data }) => {
        if (data) setProfile(data);
      });
  }, [session]);

  // Load real concerts from Supabase
  useEffect(() => {
    if (!session) return;
    supabase
      .from("concerts")
      .select("*, concert_attendees(user_id)")
      .eq("owner_id", session.user.id)
      .then(({ data }) => {
        if (data)
          setDbConcerts(
            data.map((c) => ({
              ...c,
              attendees: (c.concert_attendees || []).map((a) => a.user_id),
            })),
          );
      });
  }, [session]);

  const [users, setUsers] = useState(INIT_USERS);
  // Seed attendees from each user's upcoming array once at init
  const seededConcerts = INIT_CONCERTS.map((c) => {
    const att = INIT_USERS.filter((u) => (u.upcoming || []).includes(c.id)).map(
      (u) => u.id,
    );
    return { ...c, attendees: att };
  });
  const [view, setView] = useState("feed"); // "feed" | "search" | "profile" | "edit" | "genre"
  const [genreView, setGenreView] = useState(null); // current genre string when view==="genre"
  const [prevView, setPrevView] = useState("feed"); // where to go back from genre page
  const [artistModal, setArtistModal] = useState(null); // artist name string for sheet overlay
  const [profileId, setProfileId] = useState(null);
  const [filter, setFilter] = useState("all");
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
  const [pastShows] = useState(PAST_SHOWS);
  const [liveConcerts, setLiveConcerts] = useState(seededConcerts);

  // Merge real DB concerts in when they load
  useEffect(() => {
    if (dbConcerts.length === 0) return;
    setLiveConcerts(dbConcerts);
  }, [dbConcerts]);

  // ── EARLY AUTH RETURNS (after all hooks) ──
  if (authLoading)
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
  if (!session) return <LoginPage />;

  // Build curUser from real Supabase profile, fallback to demo while loading
  const curUser = profile
    ? {
        id: session.user.id, // real UUID
        _demoId: 0, // keep for demo UI compatibility
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
        following: [],
        upcoming: [],
        past: [],
        ratings: {},
      }
    : users[0];
  const toast = (m, e) => {
    if (e) {
      setErrMsg(m);
      setTimeout(() => setErrMsg(null), 6000);
    } else {
      setNotif(m);
      setTimeout(() => setNotif(null), 3500);
    }
  };

  const toggleAttendee = (cid, uid) => {
    const u2 = users.find((u) => u.id === uid);
    const c = liveConcerts.find((c) => c.id === cid);
    const adding = !(c.attendees || []).includes(uid);
    setLiveConcerts((p) =>
      p.map((c) =>
        c.id !== cid
          ? c
          : {
              ...c,
              attendees: adding
                ? [...c.attendees, uid]
                : c.attendees.filter((i) => i !== uid),
            },
      ),
    );
    if (adding && u2?.notify && uid !== curUser.id)
      toast(u2.name + " tagged on " + c.artist + " — notified!");
  };
  const toggleGoing = (cid) => toggleAttendee(cid, curUser.id);
  const toggleFollow = (uid) => {
    const u2 = users.find((u) => u.id === uid);
    const isF = curUser.following.includes(uid);
    setUsers((p) =>
      p.map((u) =>
        u.id === 0
          ? {
              ...u,
              following: isF
                ? u.following.filter((i) => i !== uid)
                : [...u.following, uid],
            }
          : u,
      ),
    );
    toast(isF ? "Unfollowed " + u2.name : "Now following " + u2.name + "!");
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
      if (r.length) {
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

  const addManually = () => {
    if (!nc.artist.trim() || !nc.date) return;
    setLiveConcerts((p) => [
      ...p,
      {
        ...nc,
        id: Date.now(),
        attendees: [curUser.id],
        myTicket: true,
        artist: nc.artist.trim(),
        venue: nc.venue.trim(),
        city: nc.city.trim(),
      },
    ]);
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

  const addFriend = (name) => {
    if (!name.trim()) return;
    const id = Date.now();
    const colors = [
      "#E85D3A",
      "#9B6BF5",
      "#2ECC71",
      "#3498DB",
      "#F39C12",
      "#E91E8C",
      "#1ABC9C",
    ];
    setUsers((p) => [
      ...p,
      {
        id,
        name: name.trim(),
        handle: name.trim().toLowerCase().replace(/\s+/g, ""),
        color: colors[p.length % colors.length],
        location: "",
        bio: "",
        genres: [],
        following: [],
        upcoming: [],
        past: [],
        ratings: {},
      },
    ]);
  };

  // ── DERIVED ──
  const followedIds = [curUser.id, ...curUser.following];
  const filtered =
    filter === "all"
      ? liveConcerts
      : filter === "mine"
        ? liveConcerts.filter((c) => (c.attendees || []).includes(curUser.id))
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
            </div>
          </div>
          {view === "feed" && (
            <div className="hdr-r2">
              <button
                className="btn-sm btn-outline"
                onClick={() => {
                  setLiveConcerts(seededConcerts);
                  setView("feed");
                  setFilter("all");
                }}
              >
                Demo
              </button>
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
              {!showAddF ? (
                <button className="sb-add" onClick={() => setView("search")}>
                  ⌕ Discover &amp; follow
                </button>
              ) : (
                <div>
                  <input
                    className="sb-inp"
                    placeholder="Name…"
                    value={newFN}
                    onChange={(e) => setNewFN(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addFriend(newFN);
                        setNewFN("");
                        setShowAddF(false);
                      }
                    }}
                    autoFocus
                  />
                  <div className="sb-aa">
                    <button
                      className="sb-ok"
                      onClick={() => {
                        addFriend(newFN);
                        setNewFN("");
                        setShowAddF(false);
                      }}
                    >
                      Add
                    </button>
                    <button
                      className="sb-cn"
                      onClick={() => setShowAddF(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
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
                    Load demo, scan Gmail, or add a show manually.
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
