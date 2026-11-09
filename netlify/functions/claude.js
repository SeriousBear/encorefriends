// netlify/functions/claude.js
//
// DEPRECATED — intentionally inert.
//
// This endpoint used to proxy requests to the Anthropic API using the server's
// ANTHROPIC_API_KEY. Because it was publicly reachable, anyone could POST to it
// and spend API credits (an "open proxy"). The email parser (receive-email.mjs)
// now calls Anthropic directly server-side, so nothing needs this endpoint.
//
// It is kept only as a tombstone: it forwards NOTHING and never touches the key.
// Returns 410 Gone for any request. Safe to delete once you're confident no old
// client/bookmark hits /.netlify/functions/claude.
export const handler = async () => ({
  statusCode: 410,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ error: "gone", detail: "This endpoint was removed." }),
});
