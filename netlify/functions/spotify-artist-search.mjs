// netlify/functions/spotify-artist-search.mjs
//
// Artist autocomplete proxy. Keeps the Spotify client secret server-side and
// handles CORS. Uses the client-credentials flow (no user login) and caches
// the token between calls.
//
// Setup: in Netlify → Site settings → Environment variables, add
//   SPOTIFY_CLIENT_ID      = your app's Client ID
//   SPOTIFY_CLIENT_SECRET  = your app's Client Secret
//
// Call: /.netlify/functions/spotify-artist-search?q=rad

let cachedToken = null;
let tokenExpiry = 0;

const getToken = async () => {
  const now = Date.now();
  if (cachedToken && now < tokenExpiry - 60000) return cachedToken;
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) throw new Error("Missing Spotify credentials in env");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " + Buffer.from(id + ":" + secret).toString("base64"),
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error("Spotify token error " + res.status);
  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = now + (data.expires_in || 3600) * 1000;
  return cachedToken;
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default async (req) => {
  if (req.method === "OPTIONS") return new Response("", { headers: CORS });
  const q = (new URL(req.url).searchParams.get("q") || "").trim();
  if (q.length < 2) return Response.json({ artists: [] }, { headers: CORS });
  try {
    const token = await getToken();
    const url =
      "https://api.spotify.com/v1/search?type=artist&limit=8&q=" +
      encodeURIComponent(q);
    const res = await fetch(url, {
      headers: { Authorization: "Bearer " + token },
    });
    if (!res.ok) throw new Error("Spotify search error " + res.status);
    const data = await res.json();
    const artists = (data.artists?.items || []).map((a) => ({
      id: a.id,
      name: a.name,
      image: a.images && a.images.length ? a.images[a.images.length - 1].url : "",
      genres: a.genres || [],
      followers: a.followers?.total || 0,
    }));
    return Response.json({ artists }, { headers: CORS });
  } catch (e) {
    return Response.json(
      { artists: [], error: e.message },
      { status: 500, headers: CORS },
    );
  }
};
