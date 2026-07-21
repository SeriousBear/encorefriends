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