# netlify/functions/ — what each function is and how it's triggered

Netlify serverless functions. Three kinds of trigger: **DB webhook** (a
Supabase trigger POSTs here on a table change), **HTTP** (called directly by
the app or an external service), and **scheduled** (Netlify cron). Two files
are shared modules, not endpoints.

## Database webhooks (Supabase → these functions)

| Function | Fires on | Secret header | What it does |
|---|---|---|---|
| `notify-new-show.mjs` | INSERT on `concerts` | `x-webhook-secret` = `WEBHOOK_SECRET` | Push + in-app notif to the owner's followers; discovery push to taste-matched Open-to-Connect users (capped 1/day). Skips hidden shows. |
| `notify-crew-message.mjs` | INSERT on `thread_messages` | `x-webhook-secret` = `WEBHOOK_SECRET` | Push to every crew member except the sender. Push `tag` = crew id so an active chat collapses into one notification. |

Both webhooks are created as Postgres triggers via SQL (see
`sql/crew-message-webhook.sql` for the crew one) rather than the Supabase
dashboard, so they're version-proof and in the repo. Both require the same
`WEBHOOK_SECRET` + `VAPID_*` env vars.

## HTTP endpoints (called directly)

| Function | Called by | Purpose |
|---|---|---|
| `receive-email.mjs` | Cloudflare Email Worker (forwarded tickets) | Parses a forwarded ticket email → saves concerts. Uses `parse-helpers.mjs`. Optional `?key=RECEIVE_SECRET`. |
| `claude.js` | app + `receive-email.mjs` | Server-side proxy for the Anthropic API (keeps `ANTHROPIC_API_KEY` off the client). |
| `spotify-artist-search.mjs` | app (artist autocomplete) | Proxies Spotify search; keeps the Spotify secret server-side. |
| `place-search.mjs` | app (venue/city autocomplete) | Location autocomplete proxy. |
| `backfill-genres.mjs` | manual (`?key=BACKFILL_SECRET` or `RECEIVE_SECRET`) | One-off/re-runnable: AI-tags existing concerts that have no genres. Hit until `done: true`. |

## Scheduled (Netlify cron)

| Function | Schedule | Purpose |
|---|---|---|
| `keep-supabase-warm.mjs` | `0 8 */2 * *` (08:00 UTC, every other day) | Reads one row so the free-tier Supabase project doesn't auto-pause. Production deploys only. |

## Shared modules (imported, not endpoints)

| File | Used by |
|---|---|
| `parse-helpers.mjs` | `receive-email.mjs`, `evals/` — the pure parse prompt + helpers (unit-tested) |
| `genre-taxonomy.mjs` | `receive-email.mjs`, `backfill-genres.mjs` — the genre list + `canonicalizeGenres` |

## Env vars in play

`WEBHOOK_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`,
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`,
`SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, and optional
`RECEIVE_SECRET` / `BACKFILL_SECRET`.
