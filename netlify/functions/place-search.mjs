// netlify/functions/place-search.mjs
//
// Keyless venue + city autocomplete. Queries TWO free OpenStreetMap-based
// sources in parallel and merges them:
//   • Photon (photon.komoot.io) — built for search-as-you-type, much better at
//     partial / fuzzy venue names, so it surfaces spots Nominatim fumbles.
//   • Nominatim — stricter geocoder, good for full addresses.
// Running both widens coverage so users rarely fail to find a venue. If either
// source errors or times out, we still return whatever the other found.
//
// No API key, no billing. Returns { places: [{ venue, city, full }] }. If you
// ever outgrow OSM coverage, swap a source for Google/Mapbox — the app only
// cares about that shape.
//
// Call: /.netlify/functions/place-search?q=tv%20lounge%20detroit

const ST = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA",
  Colorado: "CO", Connecticut: "CT", Delaware: "DE", "District of Columbia": "DC",
  Florida: "FL", Georgia: "GA", Hawaii: "HI", Idaho: "ID", Illinois: "IL",
  Indiana: "IN", Iowa: "IA", Kansas: "KS", Kentucky: "KY", Louisiana: "LA",
  Maine: "ME", Maryland: "MD", Massachusetts: "MA", Michigan: "MI", Minnesota: "MN",
  Mississippi: "MS", Missouri: "MO", Montana: "MT", Nebraska: "NE", Nevada: "NV",
  "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
  "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH", Oklahoma: "OK",
  Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC",
  "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT", Vermont: "VT",
  Virginia: "VA", Washington: "WA", "West Virginia": "WV", Wisconsin: "WI",
  Wyoming: "WY",
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const UA = "EncoreFriends/1.0 (https://encorefriends.com)";

// Collapse a full US state name to its two-letter code; pass through anything
// already short (a code) or non-US.
const stateCode = (s) => {
  if (!s) return "";
  if (s.length === 2) return s.toUpperCase();
  return ST[s] || s;
};

const cityState = (city, st) =>
  city && st ? city + ", " + st : city || st || "";

// ── Normalizers: map each source's raw rows to { venue, city, full } ─────────
export function fromNominatim(data) {
  return (Array.isArray(data) ? data : []).map((p) => {
    const a = p.address || {};
    const cityName =
      a.city || a.town || a.village || a.hamlet || a.suburb || a.county || "";
    const iso = a["ISO3166-2-lvl4"];
    let st = "";
    if (iso && iso.startsWith("US-")) st = iso.slice(3);
    else if (a.state) st = stateCode(a.state);
    const venue =
      p.name && p.name.trim()
        ? p.name.trim()
        : (p.display_name || "").split(",")[0].trim();
    return {
      venue,
      city: cityState(cityName, st),
      full: p.display_name || "",
    };
  });
}

export function fromPhoton(geojson) {
  const feats = (geojson && Array.isArray(geojson.features) && geojson.features) || [];
  return feats.map((f) => {
    const p = f.properties || {};
    const cityName =
      p.city || p.town || p.village || p.district || p.locality || p.county || "";
    const st = stateCode(p.state);
    const street =
      [p.housenumber, p.street].filter(Boolean).join(" ") || p.street || "";
    const venue = (p.name && p.name.trim()) || street || cityName || "";
    const full = [p.name, street, cityName, st, p.country]
      .filter(Boolean)
      .join(", ");
    return { venue, city: cityState(cityName, st), full };
  });
}

// Merge Photon (typeahead-ranked) first, then any new Nominatim rows. Dedupe on
// venue+city, drop empties, and cap the list.
export function mergePlaces(photon, nominatim, limit = 7) {
  const out = [];
  const seen = new Set();
  for (const p of [...photon, ...nominatim]) {
    if (!p || !p.venue) continue;
    const key = (p.venue + "|" + (p.city || "")).toLowerCase().trim();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
    if (out.length >= limit) break;
  }
  return out;
}

export default async (req) => {
  if (req.method === "OPTIONS") return new Response("", { headers: CORS });

  const q = (new URL(req.url).searchParams.get("q") || "").trim();
  if (q.length < 3) return Response.json({ places: [] }, { headers: CORS });

  const eq = encodeURIComponent(q);
  const getJSON = async (url, headers) => {
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(res.status + " for " + url);
    return res.json();
  };

  // Query both sources at once; one failing doesn't sink the other.
  const [photonR, nomR] = await Promise.allSettled([
    getJSON("https://photon.komoot.io/api/?limit=6&q=" + eq, {
      "User-Agent": UA,
    }),
    getJSON(
      "https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&q=" +
        eq,
      { "User-Agent": UA, "Accept-Language": "en" },
    ),
  ]);

  const photon =
    photonR.status === "fulfilled" ? fromPhoton(photonR.value) : [];
  const nominatim =
    nomR.status === "fulfilled" ? fromNominatim(nomR.value) : [];

  const places = mergePlaces(photon, nominatim);

  // Only surface an error when BOTH sources failed.
  if (places.length === 0 && photon.length === 0 && nominatim.length === 0) {
    const err =
      (photonR.reason && photonR.reason.message) ||
      (nomR.reason && nomR.reason.message) ||
      null;
    if (err) {
      return Response.json({ places: [], error: err }, { status: 500, headers: CORS });
    }
  }

  return Response.json({ places }, { headers: CORS });
};
