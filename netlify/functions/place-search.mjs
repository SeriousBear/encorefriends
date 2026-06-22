// netlify/functions/place-search.mjs
//
// Keyless venue + city autocomplete via OpenStreetMap / Nominatim.
// No API key, no billing — just deploy it. Returns the venue (named POI) and
// a "City, ST" string for each match, plus the full address as a subtitle.
//
// Respect Nominatim's usage policy: keep volume low, send a real User-Agent,
// and let the client debounce (the app waits 500ms) to stay near ~1 req/sec.
// If you outgrow it, swap the fetch below for Google/Mapbox — the app only
// cares about the { places: [{ venue, city, full }] } shape.
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

export default async (req) => {
  if (req.method === "OPTIONS") return new Response("", { headers: CORS });

  const q = (new URL(req.url).searchParams.get("q") || "").trim();
  if (q.length < 3) return Response.json({ places: [] }, { headers: CORS });

  const api =
    "https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&q=" +
    encodeURIComponent(q);

  try {
    const res = await fetch(api, {
      headers: {
        "User-Agent": "EncoreFriends/1.0 (https://encorefriends.com)",
        "Accept-Language": "en",
      },
    });
    if (!res.ok) throw new Error("Nominatim error " + res.status);
    const data = await res.json();

    const places = (Array.isArray(data) ? data : []).map((p) => {
      const a = p.address || {};
      const cityName =
        a.city || a.town || a.village || a.hamlet || a.suburb || a.county || "";
      // Prefer the ISO subdivision code (e.g. "US-MI" -> "MI") for the state.
      const iso = a["ISO3166-2-lvl4"];
      let st = "";
      if (iso && iso.startsWith("US-")) st = iso.slice(3);
      else if (a.state && ST[a.state]) st = ST[a.state];
      else if (a.state) st = a.state;
      const city =
        cityName && st ? cityName + ", " + st : cityName || st || "";
      // Venue = named POI when present, else the first chunk of the address.
      const venue =
        p.name && p.name.trim()
          ? p.name.trim()
          : (p.display_name || "").split(",")[0].trim();
      return { venue, city, full: p.display_name || "" };
    });

    return Response.json({ places }, { headers: CORS });
  } catch (e) {
    return Response.json(
      { places: [], error: e.message },
      { status: 500, headers: CORS },
    );
  }
};
