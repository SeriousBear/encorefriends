// netlify/functions/keep-supabase-warm.mjs
//
// Pings Supabase on a schedule so the free-tier project doesn't auto-pause
// after 7 days of inactivity. A single read against a real table counts as
// database activity and resets the inactivity timer.
//
// Notes:
//  - Runs only on published production deploys (not deploy previews).
//  - These are the same public values used in app.js. The anon key is safe
//    to expose; it's protected by Row Level Security. If you'd rather keep
//    them out of the repo, move them to Netlify env vars.

const SUPABASE_URL = "https://zfcehcqklrrfncihjwkk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_LhcC2ZeRoWsD3eAGNIUfwg_iSJyJqip";

export default async () => {
  const at = new Date().toISOString();
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/concerts?select=id&limit=1`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    // Any response means the project is awake and the ping registered.
    console.log(`[keep-warm] ${at} — Supabase responded ${res.status}`);
    return new Response("ok", { status: 200 });
  } catch (err) {
    // A failure here usually means the project is already paused/unreachable.
    console.error(`[keep-warm] ${at} — ping failed:`, err.message);
    return new Response("ping failed", { status: 500 });
  }
};

export const config = {
  schedule: "0 8 */2 * *", // 08:00 UTC, every other day
};
