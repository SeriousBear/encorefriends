// email-worker.js — Cloudflare Email Worker
//
// Runs on the Cloudflare zone that owns in.encorefriends.com. When a forwarded
// ticket email arrives, it parses the MIME and POSTs clean JSON to Encore's
// receive-email Netlify function (which matches the user, auto-confirms Gmail,
// parses, and saves). Free: the first 100k email triggers/day are included.
//
// Setup:
//   1. Your domain's DNS must be on Cloudflare, with Email Routing enabled.
//   2. npm i postal-mime
//   3. In wrangler.toml add:
//        name = "encore-email"
//        main = "email-worker.js"
//        compatibility_date = "2026-01-01"
//        [vars]
//        RECEIVER_URL = "https://encorefriends.com/.netlify/functions/receive-email?key=YOUR_RECEIVE_SECRET"
//   4. wrangler deploy
//   5. Cloudflare dashboard → Email → Email Routing → route all of
//      in.encorefriends.com (a catch-all) to this Worker.

import PostalMime from "postal-mime";

export default {
  async email(message, env) {
    let parsed = {};
    try {
      parsed = await PostalMime.parse(message.raw);
    } catch (e) {
      /* fall back to headers only */
    }
    const payload = {
      // message.to is the envelope recipient — i.e. <token>@in.encorefriends.com
      to: message.to,
      from: message.from,
      subject: parsed.subject || message.headers.get("subject") || "",
      text: parsed.text || "",
      html: parsed.html || "",
      envelope: { to: [message.to], from: message.from },
    };
    try {
      await fetch(env.RECEIVER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      // Don't reject the message on a transient webhook failure.
    }
  },
};
