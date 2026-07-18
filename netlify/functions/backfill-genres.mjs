// netlify/functions/backfill-genres.mjs
//
// One-time (re-runnable) backfill: tags existing concerts that have empty
// genres. Groups untagged rows by artist, asks Claude for 1-3 genres per
// artist in one batched call, canonicalizes against the shared taxonomy, and
// updates every untagged row for that artist.
//
// Each invocation does at most 2 Claude calls (~50 artists) to stay inside
// Netlify's function timeout. Call it repeatedly until it returns done: true:
//
//   curl "https://encorefriends.com/.netlify/functions/backfill-genres?key=YOUR_SECRET"
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY,
//      BACKFILL_SECRET (falls back to RECEIVE_SECRET; if neither is set the
//      endpoint is open — set one!)

import { createClient } from "@supabase/supabase-js";
import { GENRE_PROMPT_LIST, canonicalizeGenres } from "./genre-taxonomy.mjs";

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const ARTISTS_PER_CALL = 25;
const CALLS_PER_INVOCATION = 2;

const TAG_SYSTEM = `You are a music genre expert. You will receive a JSON array of live-music events: {"name": artist or festival name, "venue": string, "source": ticket platform, "festival": boolean}.

For EACH entry, tag the artist/festival with 1-3 genres chosen ONLY from the GENRE LIST below — copy the strings EXACTLY as written. Use your own knowledge of the artist; venue and source are just hints. Prefer the most specific subgenre you are confident about (e.g. "Riddim" over "Dubstep", "Melodic Techno" over "Techno"); fall back to a broad genre when unsure. Always give your best guess — use [] only if you have absolutely no idea. For festivals, tag the festival's dominant genres.

Return ONLY a valid JSON object mapping each input "name" EXACTLY as given to its genre array:
{"Artist Name": ["Genre1", "Genre2"], ...}

GENRE LIST (the only allowed values):
${GENRE_PROMPT_LIST}`;

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const untaggedFilter = (q) => q.or("genres.is.null,genres.eq.{}");

export default async (req) => {
  const secret = process.env.BACKFILL_SECRET || process.env.RECEIVE_SECRET;
  if (secret) {
    const key = new URL(req.url).searchParams.get("key");
    if (key !== secret) return new Response("forbidden", { status: 403 });
  }

  let updatedRows = 0;
  const taggedArtists = [];
  const skippedArtists = [];

  for (let call = 0; call < CALLS_PER_INVOCATION; call++) {
    // Pull a chunk of untagged rows and reduce to unique artists.
    const { data: rows, error } = await untaggedFilter(
      sb.from("concerts").select("id, artist, venue, source, is_festival"),
    ).limit(500);
    if (error) return json({ ok: false, error: error.message }, 500);
    if (!rows || rows.length === 0) break;

    const byArtist = new Map();
    for (const r of rows) {
      if (!r.artist) continue;
      if (!byArtist.has(r.artist)) byArtist.set(r.artist, r);
    }
    // Skip artists that already failed once this invocation (avoids loops).
    const batch = [...byArtist.values()]
      .filter((r) => !skippedArtists.includes(r.artist))
      .slice(0, ARTISTS_PER_CALL);
    if (batch.length === 0) break;

    // One batched Claude call for the whole group.
    let parsed = {};
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 2000,
          system: TAG_SYSTEM,
          messages: [
            {
              role: "user",
              content: JSON.stringify(
                batch.map((r) => ({
                  name: r.artist,
                  venue: r.venue || "",
                  source: r.source || "",
                  festival: !!r.is_festival,
                })),
              ),
            },
          ],
        }),
      });
      const data = await res.json();
      const text = data?.content?.[0]?.text || "";
      const mm = text.match(/\{[\s\S]*\}/);
      parsed = mm ? JSON.parse(mm[0]) : {};
    } catch (e) {
      return json(
        { ok: false, error: "Claude call failed: " + String(e) },
        500,
      );
    }

    // Write results back — every untagged row for each tagged artist.
    for (const r of batch) {
      const genres = canonicalizeGenres(parsed[r.artist]);
      if (genres.length === 0) {
        skippedArtists.push(r.artist);
        continue;
      }
      const { error: upErr, count } = await untaggedFilter(
        sb
          .from("concerts")
          .update({ genres }, { count: "exact" })
          .eq("artist", r.artist),
      );
      if (!upErr) {
        taggedArtists.push(r.artist);
        updatedRows += count || 0;
      }
    }
  }

  const { count: remaining } = await untaggedFilter(
    sb.from("concerts").select("id", { count: "exact", head: true }),
  );

  return json({
    ok: true,
    done: (remaining || 0) === 0,
    updated_rows: updatedRows,
    tagged_artists: taggedArtists.length,
    skipped_artists: skippedArtists,
    remaining_untagged_rows: remaining || 0,
  });
};
