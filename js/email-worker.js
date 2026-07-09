// email-worker.js — Cloudflare Email Worker (paste into "Create my own")
//
// Forwards the RAW email to Encore's receive-email function, which parses the
// MIME properly (postal-mime) so the parser only sees clean text. No imports,
// so it pastes straight into the Cloudflare dashboard editor.
//
// After deploying, add a Worker Secret named RECEIVER_URL:
//   https://encorefriends.com/.netlify/functions/receive-email?key=YOUR_RECEIVE_SECRET

export default {
  async email(message, env) {
    let raw = "";
    try {
      raw = await new Response(message.raw).text();
    } catch (e) {}

    const payload = {
      raw, // full MIME — the receiver parses it with a real library
      to: message.to, // envelope recipient = <token>@encorefriends.com
      from: message.from,
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
