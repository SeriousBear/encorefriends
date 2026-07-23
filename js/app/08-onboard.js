function MailConnect({ session, profile, onTokenReady, onClose }) {
  const [token, setToken] = useState((profile && profile.forward_token) || "");
  const [verified, setVerified] = useState(
    !!(profile && profile.forward_verified),
  );
  const [confirmCode, setConfirmCode] = useState(
    (profile && profile.forward_confirm_code) || "",
  );
  const [confirmLink, setConfirmLink] = useState(
    (profile && profile.forward_confirm_link) || "",
  );
  const [copied, setCopied] = useState("");

  // Mint a private, unguessable token once, and save it to the profile.
  useEffect(() => {
    if (token || !session?.user?.id) return;
    const t =
      "e" +
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID().replace(/-/g, "")
        : Math.random().toString(36).slice(2) + Date.now().toString(36));
    (async () => {
      await supabase
        .from("profiles")
        .update({ forward_token: t })
        .eq("id", session.user.id);
      setToken(t);
      onTokenReady && onTokenReady(t);
    })();
  }, []);

  // Once the backend auto-confirms the forward, it flips forward_verified.
  useEffect(() => {
    if (verified || !session?.user?.id) return;
    const iv = setInterval(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("forward_verified, forward_confirm_code, forward_confirm_link")
        .eq("id", session.user.id)
        .single();
      if (data && data.forward_confirm_code)
        setConfirmCode(data.forward_confirm_code);
      if (data && data.forward_confirm_link)
        setConfirmLink(data.forward_confirm_link);
      if (data && data.forward_verified) {
        setVerified(true);
        clearInterval(iv);
      }
    }, 5000);
    return () => clearInterval(iv);
  }, [verified]);

  const addr = token ? token + "@" + FORWARD_DOMAIN : "generating…";
  const FILTER_QUERY =
    '{from:(ticketmaster OR livenation OR seatgeek OR axs.com OR dice.fm OR ra.co OR residentadvisor OR eventbrite OR seetickets OR ticketweb OR etix OR tixr OR bandsintown OR songkick OR stubhub OR vividseats OR frontgatetickets OR eventim OR moshtix OR ticketek) "your tickets" "e-ticket" "general admission" "doors open" "will call" "your seats" "the lineup" "set times" "live music" concert festival}';

  const copy = (txt, which) => {
    try {
      if (navigator.clipboard) navigator.clipboard.writeText(txt);
    } catch (e) {}
    setCopied(which);
    setTimeout(() => setCopied(""), 1600);
  };

  // Copy what they'll need to paste, then drop them on the right Gmail screen.
  const openWith = (txt, url) => {
    try {
      if (navigator.clipboard && txt) navigator.clipboard.writeText(txt);
    } catch (e) {}
    window.open(url, "_blank", "noopener");
  };

  // Gmail only exposes forwarding rules/filters on desktop, so phones get a
  // simpler path: just forward tickets manually (no setup, no verification).
  const isMobile =
    typeof navigator !== "undefined" &&
    /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");

  const card = {
    background: "#0c0c0c",
    border: "1px solid #1e1e1e",
    borderRadius: 10,
    padding: 18,
    marginBottom: 14,
  };
  const num = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 24,
    borderRadius: "50%",
    background: "#F5A623",
    color: "#000",
    fontFamily: "'DM Mono',monospace",
    fontSize: 12,
    fontWeight: 700,
    marginRight: 10,
    flexShrink: 0,
  };
  const stepHead = {
    display: "flex",
    alignItems: "center",
    fontFamily: "'Bebas Neue',sans-serif",
    fontSize: 19,
    letterSpacing: 0.5,
    color: "#eee",
    marginBottom: 10,
  };
  const body = {
    fontFamily: "'Syne',sans-serif",
    fontSize: 13,
    lineHeight: 1.55,
    color: "#aaa",
    margin: "0 0 12px 34px",
  };
  const ghost = {
    display: "inline-block",
    fontFamily: "'DM Mono',monospace",
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#F5A623",
    border: "1px solid #2a2a2a",
    borderRadius: 6,
    padding: "8px 12px",
    textDecoration: "none",
    marginLeft: 34,
  };
  const copyBox = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginLeft: 34,
    marginBottom: 12,
  };
  const codeBox = {
    flex: 1,
    fontFamily: "'DM Mono',monospace",
    fontSize: 12,
    background: "#000",
    border: "1px solid #1e1e1e",
    borderRadius: 6,
    padding: "10px 12px",
    wordBreak: "break-all",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "#070707",
        overflowY: "auto",
      }}
    >
      <div
        style={{ maxWidth: 560, margin: "0 auto", padding: "32px 18px 60px" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 8,
          }}
        >
          <div
            style={{
              fontFamily: "'DM Mono',monospace",
              fontSize: 10,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "#F5A623",
            }}
          >
            Auto-tracking
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#666",
              fontFamily: "'DM Mono',monospace",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            I'll do this later ✕
          </button>
        </div>

        <h1
          style={{
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: 38,
            letterSpacing: 1,
            color: "#fff",
            margin: "0 0 6px",
            lineHeight: 1,
          }}
        >
          Track shows on autopilot
        </h1>
        <p
          style={{
            fontFamily: "'Syne',sans-serif",
            fontSize: 14,
            color: "#999",
            margin: "0 0 24px",
            lineHeight: 1.5,
          }}
        >
          {isMobile
            ? "Forward any ticket email to your private Encore address and it shows up here — no setup needed, right from the Gmail app."
            : "Set this up once and your concerts add themselves — every time you buy a ticket, it just shows up. Takes about a minute, and you'll never tap \"add\" again."}
        </p>

        <div style={card}>
          <div style={stepHead}>
            <span style={num}>1</span> Copy your private Encore address
          </div>
          <div style={copyBox}>
            <code style={{ ...codeBox, color: "#F5A623" }}>{addr}</code>
            <button
              onClick={() => copy(addr, "addr")}
              className="btn-sm btn-amber"
              style={{ whiteSpace: "nowrap" }}
            >
              {copied === "addr" ? "Copied ✓" : "Copy"}
            </button>
          </div>
          <p style={body}>
            This one's yours alone. It isn't an inbox you check — just a private
            drop box where Gmail tucks your ticket emails so Encore can read
            them.
          </p>
        </div>

        {isMobile ? (
          <div style={card}>
            <div style={stepHead}>
              <span style={num}>2</span> Forward your tickets
            </div>
            <p style={body}>
              In the Gmail app, open a ticket confirmation → tap the{" "}
              <b style={{ color: "#ccc" }}>Forward</b> arrow → send it to the
              address above. It shows up in your feed within a few seconds.
            </p>
            <div
              style={{
                marginLeft: 34,
                marginTop: 4,
                padding: "12px 14px",
                background: "#0c0c0c",
                border: "1px solid #1e1e1e",
                borderRadius: 8,
                fontFamily: "'Syne',sans-serif",
                fontSize: 12.5,
                color: "#888",
                lineHeight: 1.5,
              }}
            >
              Want it fully hands-off, with no manual forwarding? Gmail only
              lets you set up auto-forwarding on a computer — open Encore on a
              laptop anytime and we'll walk you through the one-minute setup.
            </div>
          </div>
        ) : (
          <>
            <div style={card}>
              <div style={stepHead}>
                <span style={num}>2</span> Paste it into Gmail
          </div>
          <p style={body}>
            Open Gmail's forwarding settings, click{" "}
            <b style={{ color: "#ccc" }}>Add a forwarding address</b>, paste your
            address, and hit Next → Proceed.
          </p>
          <button
            type="button"
            onClick={() =>
              openWith(
                addr,
                "https://mail.google.com/mail/u/0/#settings/fwdandpop",
              )
            }
            style={{ ...ghost, background: "none", cursor: "pointer" }}
          >
            Open Gmail forwarding — address copied ↗
          </button>
          <div
            style={{
              marginLeft: 34,
              marginTop: 6,
              fontFamily: "'DM Mono',monospace",
              fontSize: 11,
              color: "#666",
              lineHeight: 1.5,
            }}
          >
            Panel didn't fully load? Click the ⚙ gear → See all settings →
            Forwarding and POP/IMAP → Add a forwarding address, then paste
            (your address is already copied).
          </div>
          <div
            style={{
              marginLeft: 34,
              marginTop: 14,
              fontFamily: "'Syne',sans-serif",
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            {verified ? (
              <span style={{ color: "#5cc46a" }}>
                ✓ Verified — Gmail's all set.
              </span>
            ) : confirmLink ? (
              <div>
                <div style={{ color: "#aaa", marginBottom: 8 }}>
                  Gmail sent its confirmation — one tap to finish. This opens
                  Google; just hit <b style={{ color: "#ccc" }}>Confirm</b>:
                </div>
                <button
                  type="button"
                  onClick={() =>
                    window.open(confirmLink, "_blank", "noopener")
                  }
                  className="btn-sm btn-amber"
                >
                  Finish verifying in Gmail →
                </button>
              </div>
            ) : confirmCode ? (
              <span style={{ color: "#aaa" }}>
                Almost there — enter this code on Gmail's forwarding screen:{" "}
                <b
                  style={{
                    color: "#F5A623",
                    fontFamily: "'DM Mono',monospace",
                  }}
                >
                  {confirmCode}
                </b>
              </span>
            ) : (
              <span style={{ color: "#888" }}>
                <span style={{ opacity: 0.7 }}>◌</span> Waiting for Gmail's
                confirmation… once you add the address above, a "Finish
                verifying" button shows up here within a few seconds.
              </span>
            )}
          </div>
        </div>

        <div style={card}>
          <div style={stepHead}>
            <span style={num}>3</span> Choose what forwards
          </div>
          <p style={body}>
            One filter keeps it to ticket emails only — nothing else leaves your
            inbox. In Gmail filters, click{" "}
            <b style={{ color: "#ccc" }}>Create a new filter</b> and paste this
            into the <b style={{ color: "#ccc" }}>Has the words</b> box:
          </p>
          <div style={copyBox}>
            <code style={{ ...codeBox, color: "#ccc", fontSize: 11.5 }}>
              {FILTER_QUERY}
            </code>
            <button
              onClick={() => copy(FILTER_QUERY, "q")}
              className="btn-sm btn-amber"
              style={{ whiteSpace: "nowrap" }}
            >
              {copied === "q" ? "Copied ✓" : "Copy"}
            </button>
          </div>
          <p style={body}>
            Then <b style={{ color: "#ccc" }}>Create filter</b> → check{" "}
            <b style={{ color: "#ccc" }}>Forward it to</b> → pick your Encore
            address → <b style={{ color: "#ccc" }}>Create filter</b>. That's it.
          </p>
          <button
            type="button"
            onClick={() =>
              openWith(
                FILTER_QUERY,
                "https://mail.google.com/mail/u/0/#settings/filters",
              )
            }
            style={{ ...ghost, background: "none", cursor: "pointer" }}
          >
            Open Gmail filters — filter text copied ↗
          </button>
          <div
            style={{
              marginLeft: 34,
              marginTop: 6,
              fontFamily: "'DM Mono',monospace",
              fontSize: 11,
              color: "#666",
              lineHeight: 1.5,
            }}
          >
            Not showing? ⚙ gear → See all settings → Filters and Blocked
            Addresses → Create a new filter (the filter text is copied).
          </div>
            </div>
          </>
        )}

        <div
          style={{
            background: verified ? "rgba(92,196,106,0.08)" : "#0c0c0c",
            border:
              "1px solid " + (verified ? "rgba(92,196,106,0.4)" : "#1e1e1e"),
            borderRadius: 10,
            padding: 16,
            textAlign: "center",
            fontFamily: "'Syne',sans-serif",
            fontSize: 13,
            color: verified ? "#9fd9a0" : "#888",
            margin: "4px 0 20px",
          }}
        >
          {verified
            ? "✓ Connected. New tickets land here on their own from now on."
            : isMobile
              ? "Forward a ticket to your address above and it'll appear here in seconds."
              : "Once Gmail's set, new ticket emails flow in automatically — even when Encore is closed."}
        </div>

        <div style={{ textAlign: "center" }}>
          <button
            onClick={onClose}
            className="btn-amber"
            style={{ padding: "12px 28px" }}
          >
            {verified ? "Done" : "Got it"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ONBOARDING WALKTHROUGH ───────────────────────────────────────────────────
// Shown once, right after a new user signs in, before they reach the app.
// name + handle are required; location, genres, artists are optional.
// Writes the real row to `profiles` and hands it back via onComplete.
function Onboarding({ session, profile, onComplete }) {
  const meta = (session.user && session.user.user_metadata) || {};
  const p = profile || {};
  const [step, setStep] = useState(1);
  const [name, setName] = useState(p.name || meta.full_name || meta.name || "");
  const [handle, setHandle] = useState(
    (p.handle || meta.full_name || meta.name || "")
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 20),
  );
  const [handleStatus, setHandleStatus] = useState(""); // "", checking, taken, ok, short
  const [location, setLocation] = useState(p.location || "");
  const [email, setEmail] = useState((session.user && session.user.email) || "");
  const [phone, setPhone] = useState("");
  const [genres, setGenres] = useState(p.genres || []);
  const [artists, setArtists] = useState(p.artists || []);
  const [discoverable, setDiscoverable] = useState(!!p.discoverable);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const [color] = useState(() => {
    const palette = [
      "#E85D3A", "#9B6BF5", "#2ECC71", "#3498DB",
      "#F39C12", "#E91E8C", "#1ABC9C", "#F5A623",
    ];
    return p.color || palette[Math.floor(Math.random() * palette.length)];
  });

  // Live handle availability check (debounced)
  useEffect(() => {
    const h = handle.trim();
    if (h.length === 0) {
      setHandleStatus("");
      return;
    }
    if (h.length < 2) {
      setHandleStatus("short");
      return;
    }
    setHandleStatus("checking");
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("handle", h)
        .maybeSingle();
      if (data && data.id !== session.user.id) setHandleStatus("taken");
      else setHandleStatus("ok");
    }, 400);
    return () => clearTimeout(t);
  }, [handle]);

  const step1Valid =
    name.trim().length > 0 && handle.trim().length >= 2 && handleStatus === "ok";

  const finish = async () => {
    setSaving(true);
    setErr(null);
    const row = {
      id: session.user.id,
      name: name.trim(),
      handle: handle.trim(),
      color,
      location: location.trim(),
      bio: p.bio || "",
      genres,
      artists,
      discoverable,
      vibe: p.vibe || "both",
      total_shows: p.total_shows || 0,
      social: p.social || {},
      onboarded: true,
    };
    const { data, error } = await supabase
      .from("profiles")
      .upsert(row, { onConflict: "id" })
      .select()
      .single();
    if (error) {
      setErr(error.message);
      setSaving(false);
      return;
    }
    // Contact info lives in a separate, owner-only table — NOT in the public
    // profiles table (which is world-readable). Used for friend notifications.
    if (email.trim() || phone.trim()) {
      await supabase
        .from("user_contacts")
        .upsert(
          { id: session.user.id, email: email.trim(), phone: phone.trim() },
          { onConflict: "id" },
        );
    }
    onComplete(data);
  };

  const lbl = {
    fontFamily: "'DM Mono',monospace",
    fontSize: 10,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: "#F5A623",
    marginBottom: 8,
    display: "block",
  };
  const inp = {
    width: "100%",
    background: "#0c0c0c",
    border: "1px solid #1e1e1e",
    borderRadius: 6,
    color: "#f0ede8",
    fontFamily: "'Syne',sans-serif",
    fontSize: 15,
    padding: "12px 13px",
    outline: "none",
    boxSizing: "border-box",
  };
  const help = {
    fontFamily: "'DM Mono',monospace",
    fontSize: 10,
    color: "#555",
    marginTop: 6,
    lineHeight: 1.5,
  };

  const handleMsg = {
    checking: { t: "Checking…", c: "#555" },
    taken: { t: "That handle's taken — try another.", c: "#ff6b6b" },
    ok: { t: "Available", c: "#2ECC71" },
    short: { t: "A little longer, please.", c: "#555" },
    "": { t: "", c: "#555" },
  }[handleStatus];

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        background: "#070707",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 26 }}>
        <div
          style={{
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: 40,
            letterSpacing: 7,
            color: "#F5A623",
          }}
        >
          ENCORE
        </div>
        <div
          style={{
            fontFamily: "'DM Mono',monospace",
            fontSize: 10,
            letterSpacing: 3,
            color: "#444",
            textTransform: "uppercase",
          }}
        >
          Let's build your profile
        </div>
      </div>

      <div
        style={{
          background: "#111",
          border: "1px solid #1e1e1e",
          borderRadius: 10,
          padding: "30px 26px",
          maxWidth: 400,
          width: "100%",
        }}
      >
        {/* step dots */}
        <div
          style={{
            display: "flex",
            gap: 6,
            justifyContent: "center",
            marginBottom: 26,
          }}
        >
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              style={{
                width: n === step ? 22 : 7,
                height: 7,
                borderRadius: 4,
                background: n === step ? "#F5A623" : n < step ? "#7a5a1e" : "#262626",
                transition: "all .2s",
              }}
            />
          ))}
        </div>

        {/* STEP 1 — name + handle */}
        {step === 1 && (
          <div>
            <div
              style={{
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: 24,
                letterSpacing: 1,
                marginBottom: 4,
              }}
            >
              The basics
            </div>
            <div style={{ ...help, marginTop: 0, marginBottom: 22 }}>
              Just a name and a handle. You can change these later.
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>Your name</label>
              <input
                style={inp}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Kyle Weber"
                maxLength={40}
              />
            </div>

            <div>
              <label style={lbl}>Handle</label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 13,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#555",
                    fontFamily: "'Syne',sans-serif",
                    fontSize: 15,
                  }}
                >
                  @
                </span>
                <input
                  style={{ ...inp, paddingLeft: 26 }}
                  value={handle}
                  onChange={(e) =>
                    setHandle(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9_]/g, "")
                        .slice(0, 20),
                    )
                  }
                  placeholder="kyleweber"
                />
              </div>
              {handleMsg.t && (
                <div style={{ ...help, color: handleMsg.c }}>{handleMsg.t}</div>
              )}
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!step1Valid}
              style={{
                width: "100%",
                marginTop: 28,
                padding: "13px",
                background: step1Valid ? "#F5A623" : "#2a2a2a",
                color: step1Valid ? "#000" : "#555",
                border: "none",
                borderRadius: 6,
                fontFamily: "'Syne',sans-serif",
                fontSize: 14,
                fontWeight: 700,
                cursor: step1Valid ? "pointer" : "not-allowed",
              }}
            >
              Continue
            </button>
          </div>
        )}

        {/* STEP 2 — location */}
        {step === 2 && (
          <div>
            <div
              style={{
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: 24,
                letterSpacing: 1,
                marginBottom: 4,
              }}
            >
              Location & notifications
            </div>
            <div style={{ ...help, marginTop: 0, marginBottom: 22 }}>
              All optional. Email and phone are how friends can ping you when
              they grab tickets — kept private, never shown on your profile.
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={lbl}>City</label>
              <input
                style={inp}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Brooklyn, NY"
                maxLength={60}
              />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={lbl}>Email for notifications</label>
              <input
                style={inp}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                maxLength={120}
              />
            </div>
            <div>
              <label style={lbl}>Phone (for texts)</label>
              <input
                style={inp}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 123 4567"
                maxLength={30}
              />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
              <button onClick={() => setStep(1)} style={btnBack}>
                Back
              </button>
              <button onClick={() => setStep(3)} style={btnNext}>
                Continue
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — taste */}
        {step === 3 && (
          <div>
            <div
              style={{
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: 24,
                letterSpacing: 1,
                marginBottom: 4,
              }}
            >
              Your music taste
            </div>
            <div style={{ ...help, marginTop: 0, marginBottom: 22 }}>
              Optional — pick a few so friends can see what you're into.
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>Genres</label>
              <TagSearch
                value={genres}
                onChange={setGenres}
                suggestions={GENRES}
                max={8}
                placeholder="House, Techno, Bass…"
              />
            </div>

            <div>
              <label style={lbl}>Favorite artists</label>
              <ArtistSearch
                value={artists}
                onChange={setArtists}
                max={5}
                placeholder="Search artists…"
              />
            </div>

            <div
              onClick={() => setDiscoverable((d) => !d)}
              style={{
                marginTop: 24,
                padding: "14px 15px",
                background: discoverable ? "rgba(245,166,35,.06)" : "#0c0c0c",
                border:
                  "1px solid " +
                  (discoverable ? "rgba(245,166,35,.35)" : "#1e1e1e"),
                borderRadius: 8,
                cursor: "pointer",
                transition: "all .15s",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    fontFamily: "'Syne',sans-serif",
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  🔓 Open to Connect
                </div>
                <div
                  style={{
                    fontFamily: "'DM Mono',monospace",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 1,
                    padding: "3px 10px",
                    borderRadius: 10,
                    color: discoverable ? "#F5A623" : "#555",
                    border:
                      "1px solid " +
                      (discoverable ? "rgba(245,166,35,.4)" : "#2a2a2a"),
                  }}
                >
                  {discoverable ? "ON" : "OFF"}
                </div>
              </div>
              <div style={{ ...help, marginTop: 8 }}>
                Looking to make friends and hit shows together? Open your
                profile so people who share your taste can find you. When off,
                only friends and people you follow can see you. Change it
                anytime in Edit Profile.
              </div>
            </div>

            {err && (
              <div style={{ ...help, color: "#ff6b6b", marginTop: 16 }}>
                Couldn't save: {err}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
              <button
                onClick={() => setStep(2)}
                disabled={saving}
                style={btnBack}
              >
                Back
              </button>
              <button onClick={finish} disabled={saving} style={btnNext}>
                {saving ? "Saving…" : "Finish"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const btnBack = {
  flex: "0 0 auto",
  padding: "13px 18px",
  background: "transparent",
  color: "#777",
  border: "1px solid #262626",
  borderRadius: 6,
  fontFamily: "'Syne',sans-serif",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};
const btnNext = {
  flex: 1,
  padding: "13px",
  background: "#F5A623",
  color: "#000",
  border: "none",
  borderRadius: 6,
  fontFamily: "'Syne',sans-serif",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

// ── ADMIN DASHBOARD (gated to profile.is_admin) ──────────────────────────────
function AdminPage({ onBack }) {
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({});
  const [users, setUsers] = useState([]);
  const [uq, setUq] = useState("");
  const [bugs, setBugs] = useState([]);
  const [fwd, setFwd] = useState({
    saved: 0,
    no_show: 0,
    ignored: 0,
    unmatched: 0,
    error: 0,
    rate_limited: 0,
    confirm: 0,
    failures: [],
  });
  const [taste, setTaste] = useState({ artists: [], venues: [] });
  const [health, setHealth] = useState({ spotify: "…", places: "…" });
  const [growth, setGrowth] = useState({
    dau: 0,
    wau: 0,
    newWeek: 0,
    verified: 0,
    series: [],
    sources: [],
  });

  const load = async () => {
    setLoading(true);
    const today = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
    const [prof, con, fol, be, fe] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id,name,handle,location,total_shows,created_at,onboarded,last_active,forward_verified",
        )
        .order("created_at", { ascending: false }),
      supabase.from("concerts").select("artist,venue,date,source"),
      supabase.from("follows").select("follower_id", { count: "exact", head: true }),
      supabase
        .from("bug_reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(25),
      supabase
        .from("forward_events")
        .select("result,subject,detail,created_at")
        .gte("created_at", weekAgo)
        .order("created_at", { ascending: false })
        .limit(1000),
    ]);
    const profs = prof.data || [];
    const cons = con.data || [];
    setUsers(profs);
    setCounts({
      users: profs.length,
      onboarded: profs.filter((p) => p.onboarded).length,
      shows: cons.length,
      upcoming: cons.filter((c) => c.date >= today).length,
      follows: fol.count || 0,
    });
    const t = {
      saved: 0,
      no_show: 0,
      ignored: 0,
      unmatched: 0,
      error: 0,
      rate_limited: 0,
      confirm: 0,
      failures: [],
    };
    (fe.data || []).forEach((e) => {
      if (t[e.result] != null) t[e.result]++;
      if (e.result === "no_show" || e.result === "error") t.failures.push(e);
    });
    setFwd(t);
    setBugs(be.data || []);
    const tally = (arr, key) => {
      const m = {};
      arr.forEach((c) => {
        const v = (c[key] || "").trim();
        if (v) m[v] = (m[v] || 0) + 1;
      });
      return Object.entries(m)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);
    };
    setTaste({ artists: tally(cons, "artist"), venues: tally(cons, "venue") });

    // growth + engagement
    const now = Date.now();
    const dayMs = 864e5;
    const within = (ts, days) =>
      ts && now - new Date(ts).getTime() < days * dayMs;
    const series = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * dayMs).toISOString().slice(0, 10);
      series.push({
        d,
        n: profs.filter((p) => (p.created_at || "").slice(0, 10) === d).length,
      });
    }
    const sm = {};
    cons.forEach((c) => {
      const s = (c.source || "Other").trim() || "Other";
      sm[s] = (sm[s] || 0) + 1;
    });
    setGrowth({
      dau: profs.filter((p) => within(p.last_active, 1)).length,
      wau: profs.filter((p) => within(p.last_active, 7)).length,
      newWeek: profs.filter((p) => within(p.created_at, 7)).length,
      verified: profs.filter((p) => p.forward_verified).length,
      series,
      sources: Object.entries(sm).sort((a, b) => b[1] - a[1]),
    });
    setLoading(false);
    const ping = async (url) => {
      try {
        const r = await fetch(url);
        return r.ok ? "ok" : "err " + r.status;
      } catch (e) {
        return "down";
      }
    };
    setHealth({
      spotify: await ping("/.netlify/functions/spotify-artist-search?q=test"),
      places: await ping("/.netlify/functions/place-search?q=test"),
    });
  };

  useEffect(() => {
    load();
  }, []);

  const delUser = async (u) => {
    if (
      !window.confirm(
        "Delete " +
          (u.name || u.handle || "user") +
          "? This removes their profile and shows. Can't be undone.",
      )
    )
      return;
    await supabase.from("profiles").delete().eq("id", u.id);
    setUsers((p) => p.filter((x) => x.id !== u.id));
  };

  const shownUsers = users.filter((u) => {
    const q = uq.trim().toLowerCase();
    if (!q) return true;
    return ((u.name || "") + " " + (u.handle || "") + " " + (u.location || ""))
      .toLowerCase()
      .includes(q);
  });

  const card = {
    background: "#0c0c0c",
    border: "1px solid #1e1e1e",
    borderRadius: 10,
    padding: 16,
  };
  const sectionTitle = {
    fontFamily: "'DM Mono',monospace",
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#F5A623",
    margin: "26px 0 12px",
  };
  const mono = { fontFamily: "'DM Mono',monospace" };
  const pill = (state) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontFamily: "'DM Mono',monospace",
    fontSize: 12,
    color: state === "ok" ? "#5cc46a" : state === "…" ? "#888" : "#e0674f",
  });

  const Stat = ({ label, value, sub }) => (
    <div style={card}>
      <div
        style={{
          fontFamily: "'Bebas Neue',sans-serif",
          fontSize: 34,
          color: "#fff",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          ...mono,
          fontSize: 10,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          color: "#888",
          marginTop: 6,
        }}
      >
        {label}
      </div>
      {sub && (
        <div style={{ ...mono, fontSize: 10, color: "#555", marginTop: 2 }}>
          {sub}
        </div>
      )}
    </div>
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 210,
        background: "#070707",
        overflowY: "auto",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 18px 70px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 4,
          }}
        >
          <h1
            style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: 34,
              color: "#fff",
              letterSpacing: 1,
              margin: 0,
            }}
          >
            Admin
          </h1>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-sm" onClick={load} style={{ color: "#888" }}>
              ⟲ Refresh
            </button>
            <button className="btn-sm btn-amber" onClick={onBack}>
              Close
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ ...mono, color: "#666", padding: "40px 0" }}>
            Loading…
          </div>
        ) : (
          <>
            {/* COUNTS */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(112px,1fr))",
                gap: 10,
                marginTop: 16,
              }}
            >
              <Stat
                label="Users"
                value={counts.users}
                sub={counts.onboarded + " onboarded"}
              />
              <Stat label="Active today" value={growth.dau} />
              <Stat label="Active 7d" value={growth.wau} />
              <Stat label="New 7d" value={growth.newWeek} />
              <Stat
                label="Shows"
                value={counts.shows}
                sub={counts.upcoming + " upcoming"}
              />
              <Stat label="Follows" value={counts.follows} />
              <Stat label="Forwarding on" value={growth.verified} />
            </div>

            {/* SIGNUPS CHART */}
            <div style={sectionTitle}>Signups — last 30 days</div>
            <div
              style={{
                ...card,
                display: "flex",
                alignItems: "flex-end",
                gap: 2,
                height: 96,
              }}
            >
              {(() => {
                const max = Math.max(1, ...growth.series.map((p) => p.n));
                return growth.series.map((pt, i) => (
                  <div
                    key={i}
                    title={pt.d + ": " + pt.n}
                    style={{
                      flex: 1,
                      height: (pt.n / max) * 66 + 2,
                      minHeight: 2,
                      borderRadius: 2,
                      background: pt.n ? "#F5A623" : "#191919",
                    }}
                  />
                ));
              })()}
            </div>

            {/* SOURCE BREAKDOWN */}
            <div style={sectionTitle}>How shows get added</div>
            <div style={card}>
              {growth.sources.length === 0 ? (
                <div style={{ ...mono, fontSize: 11, color: "#555" }}>—</div>
              ) : (
                (() => {
                  const total =
                    growth.sources.reduce((a, [, x]) => a + x, 0) || 1;
                  return growth.sources.map(([s, n]) => (
                    <div
                      key={s}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "4px 0",
                      }}
                    >
                      <div style={{ width: 96, ...mono, fontSize: 11, color: "#aaa" }}>
                        {s}
                      </div>
                      <div
                        style={{
                          flex: 1,
                          height: 8,
                          background: "#141414",
                          borderRadius: 4,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: (n / total) * 100 + "%",
                            height: "100%",
                            background: "#F5A623",
                          }}
                        />
                      </div>
                      <div
                        style={{
                          ...mono,
                          fontSize: 11,
                          color: "#666",
                          width: 40,
                          textAlign: "right",
                        }}
                      >
                        {n}
                      </div>
                    </div>
                  ));
                })()
              )}
            </div>

            {/* HEALTH */}
            <div style={sectionTitle}>Health</div>
            <div style={{ ...card, display: "flex", gap: 24, flexWrap: "wrap" }}>
              <span style={pill(health.spotify)}>
                {health.spotify === "ok" ? "●" : "○"} Spotify proxy:{" "}
                {health.spotify}
              </span>
              <span style={pill(health.places)}>
                {health.places === "ok" ? "●" : "○"} Places proxy:{" "}
                {health.places}
              </span>
              <span style={pill("ok")}>● Supabase: ok</span>
            </div>

            {/* FORWARDING */}
            <div style={sectionTitle}>Forwarding — last 7 days</div>
            <div style={card}>
              <div
                style={{
                  display: "flex",
                  gap: 20,
                  flexWrap: "wrap",
                  marginBottom: fwd.failures.length ? 14 : 0,
                }}
              >
                {[
                  ["saved", "#5cc46a"],
                  ["no_show", "#e0a13f"],
                  ["ignored", "#888"],
                  ["unmatched", "#e0674f"],
                  ["error", "#e0674f"],
                  ["rate_limited", "#888"],
                  ["confirm", "#888"],
                ].map(([k, c]) => (
                  <div key={k}>
                    <span
                      style={{
                        fontFamily: "'Bebas Neue',sans-serif",
                        fontSize: 26,
                        color: c,
                      }}
                    >
                      {fwd[k]}
                    </span>
                    <span
                      style={{
                        ...mono,
                        fontSize: 10,
                        color: "#777",
                        marginLeft: 6,
                      }}
                    >
                      {k}
                    </span>
                  </div>
                ))}
              </div>
              {fwd.failures.length > 0 && (
                <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 10 }}>
                  <div
                    style={{ ...mono, fontSize: 10, color: "#888", marginBottom: 6 }}
                  >
                    RECENT FAILURES
                  </div>
                  {fwd.failures.slice(0, 8).map((f, i) => (
                    <div key={i} style={{ padding: "3px 0" }}>
                      <div
                        style={{ ...mono, fontSize: 11, color: "#aaa" }}
                      >
                        <span
                          style={{
                            color: f.result === "error" ? "#e0674f" : "#e0a13f",
                          }}
                        >
                          [{f.result}]
                        </span>{" "}
                        {f.subject || "(no subject)"}{" "}
                        <span style={{ color: "#555" }}>
                          · {timeAgo(f.created_at)}
                        </span>
                      </div>
                      {f.detail && (
                        <div
                          style={{
                            ...mono,
                            fontSize: 10,
                            color: "#777",
                            paddingLeft: 14,
                          }}
                        >
                          ↳ {f.detail}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* BUG REPORTS */}
            <div style={sectionTitle}>Bug reports ({bugs.length})</div>
            <div style={card}>
              {bugs.length === 0 ? (
                <div style={{ ...mono, color: "#555", fontSize: 12 }}>
                  None yet.
                </div>
              ) : (
                bugs.map((b) => (
                  <div
                    key={b.id}
                    style={{
                      padding: "10px 0",
                      borderBottom: "1px solid #141414",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'Syne',sans-serif",
                        fontSize: 13,
                        color: "#ddd",
                      }}
                    >
                      {b.message}
                    </div>
                    <div style={{ ...mono, fontSize: 10, color: "#555", marginTop: 3 }}>
                      {timeAgo(b.created_at)}
                      {b.context && b.context.view
                        ? " · view:" + b.context.view
                        : ""}
                      {b.context && b.context.userAgent
                        ? " · " +
                          (/Mobi|iPhone|Android/i.test(b.context.userAgent)
                            ? "mobile"
                            : "desktop")
                        : ""}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* TASTE */}
            <div style={sectionTitle}>Top taste</div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              {[
                ["Artists", taste.artists],
                ["Venues", taste.venues],
              ].map(([label, list]) => (
                <div key={label} style={card}>
                  <div
                    style={{ ...mono, fontSize: 10, color: "#888", marginBottom: 8 }}
                  >
                    {label.toUpperCase()}
                  </div>
                  {list.length === 0 ? (
                    <div style={{ ...mono, fontSize: 11, color: "#555" }}>—</div>
                  ) : (
                    list.map(([name, n]) => (
                      <div
                        key={name}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontFamily: "'Syne',sans-serif",
                          fontSize: 12.5,
                          color: "#ccc",
                          padding: "2px 0",
                        }}
                      >
                        <span
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {name}
                        </span>
                        <span style={{ ...mono, color: "#666" }}>{n}</span>
                      </div>
                    ))
                  )}
                </div>
              ))}
            </div>

            {/* USERS */}
            <div style={sectionTitle}>Users ({users.length})</div>
            <input
              className="form-inp"
              placeholder="Search name, handle, city…"
              value={uq}
              onChange={(e) => setUq(e.target.value)}
              style={{ width: "100%", marginBottom: 10 }}
            />
            <div style={card}>
              {shownUsers.slice(0, 100).map((u) => (
                <div
                  key={u.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 0",
                    borderBottom: "1px solid #141414",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "'Syne',sans-serif",
                        fontSize: 13,
                        color: "#ddd",
                      }}
                    >
                      {u.name || "—"}{" "}
                      <span style={{ color: "#666" }}>@{u.handle}</span>
                      {!u.onboarded && (
                        <span style={{ color: "#e0a13f", fontSize: 10 }}>
                          {" "}
                          (not onboarded)
                        </span>
                      )}
                    </div>
                    <div style={{ ...mono, fontSize: 10, color: "#555" }}>
                      {u.location || "no location"} · joined{" "}
                      {timeAgo(u.created_at)}
                    </div>
                  </div>
                  <button
                    className="btn-sm"
                    onClick={() => delUser(u)}
                    style={{ color: "#e0674f", borderColor: "#3a1e1e" }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
