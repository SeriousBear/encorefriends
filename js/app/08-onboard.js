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

  // Walkthrough styling lives in css/app.css (.mc-card/.mc-num/.mc-step/
  // .mc-body/.mc-ghost/.mc-copy/.mc-code).

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "var(--bg)",
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
              fontFamily: "var(--font-mono)",
              fontSize: "var(--fs-2xs)",
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "var(--gold)",
            }}
          >
            Auto-tracking
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--fg3)",
              fontFamily: "var(--font-mono)",
              fontSize: "var(--fs-xs)",
              cursor: "pointer",
            }}
          >
            I'll do this later ✕
          </button>
        </div>

        <h1
          style={{
            fontFamily: "var(--font-display)",
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
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-md)",
            color: "#999",
            margin: "0 0 24px",
            lineHeight: 1.5,
          }}
        >
          {isMobile
            ? "Forward any ticket email to your private Encore address and it shows up here — no setup needed, right from the Gmail app."
            : "Set this up once and your concerts add themselves — every time you buy a ticket, it just shows up. Takes about a minute, and you'll never tap \"add\" again."}
        </p>

        <div className="mc-card">
          <div className="mc-step">
            <span className="mc-num">1</span> Copy your private Encore address
          </div>
          <div className="mc-copy">
            <code className="mc-code" style={{ color: "var(--gold)" }}>{addr}</code>
            <button
              onClick={() => copy(addr, "addr")}
              className="btn-sm btn-amber"
              style={{ whiteSpace: "nowrap" }}
            >
              {copied === "addr" ? "Copied ✓" : "Copy"}
            </button>
          </div>
          <p className="mc-body">
            This one's yours alone. It isn't an inbox you check — just a private
            drop box where Gmail tucks your ticket emails so Encore can read
            them.
          </p>
        </div>

        {isMobile ? (
          <div className="mc-card">
            <div className="mc-step">
              <span className="mc-num">2</span> Forward your tickets
            </div>
            <p className="mc-body">
              In the Gmail app, open a ticket confirmation → tap the{" "}
              <b style={{ color: "var(--fg2)" }}>Forward</b> arrow → send it to the
              address above. It shows up in your feed within a few seconds.
            </p>
            <div
              style={{
                marginLeft: 34,
                marginTop: 4,
                padding: "12px 14px",
                background: "var(--panel)",
                border: "1px solid var(--line)",
                borderRadius: 8,
                fontFamily: "var(--font-body)",
                fontSize: 13.5,
                color: "var(--fg2)",
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
            <div className="mc-card">
              <div className="mc-step">
                <span className="mc-num">2</span> Paste it into Gmail
          </div>
          <p className="mc-body">
            Open Gmail's forwarding settings, click{" "}
            <b style={{ color: "var(--fg2)" }}>Add a forwarding address</b>, paste your
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
            className="mc-ghost"
            style={{ background: "none", cursor: "pointer" }}
          >
            Open Gmail forwarding — address copied ↗
          </button>
          <div
            style={{
              marginLeft: 34,
              marginTop: 6,
              fontFamily: "var(--font-mono)",
              fontSize: "var(--fs-xs)",
              color: "var(--fg3)",
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
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-sm)",
              lineHeight: 1.5,
            }}
          >
            {verified ? (
              <span style={{ color: "#5cc46a" }}>
                ✓ Verified — Gmail's all set.
              </span>
            ) : confirmLink ? (
              <div>
                <div style={{ color: "var(--fg2)", marginBottom: 8 }}>
                  Gmail sent its confirmation — one tap to finish. This opens
                  Google; just hit <b style={{ color: "var(--fg2)" }}>Confirm</b>:
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
              <span style={{ color: "var(--fg2)" }}>
                Almost there — enter this code on Gmail's forwarding screen:{" "}
                <b
                  style={{
                    color: "var(--gold)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {confirmCode}
                </b>
              </span>
            ) : (
              <span style={{ color: "var(--fg2)" }}>
                <span style={{ opacity: 0.7 }}>◌</span> Waiting for Gmail's
                confirmation… once you add the address above, a "Finish
                verifying" button shows up here within a few seconds.
              </span>
            )}
          </div>
        </div>

        <div className="mc-card">
          <div className="mc-step">
            <span className="mc-num">3</span> Choose what forwards
          </div>
          <p className="mc-body">
            One filter keeps it to ticket emails only — nothing else leaves your
            inbox. In Gmail filters, click{" "}
            <b style={{ color: "var(--fg2)" }}>Create a new filter</b> and paste this
            into the <b style={{ color: "var(--fg2)" }}>Has the words</b> box:
          </p>
          <div className="mc-copy">
            <code className="mc-code" style={{ color: "var(--fg2)", fontSize: 11.5 }}>
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
          <p className="mc-body">
            Then <b style={{ color: "var(--fg2)" }}>Create filter</b> → check{" "}
            <b style={{ color: "var(--fg2)" }}>Forward it to</b> → pick your Encore
            address → <b style={{ color: "var(--fg2)" }}>Create filter</b>. That's it.
          </p>
          <button
            type="button"
            onClick={() =>
              openWith(
                FILTER_QUERY,
                "https://mail.google.com/mail/u/0/#settings/filters",
              )
            }
            className="mc-ghost"
            style={{ background: "none", cursor: "pointer" }}
          >
            Open Gmail filters — filter text copied ↗
          </button>
          <div
            style={{
              marginLeft: 34,
              marginTop: 6,
              fontFamily: "var(--font-mono)",
              fontSize: "var(--fs-xs)",
              color: "var(--fg3)",
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
            background: verified ? "rgba(92,196,106,0.08)" : "var(--panel)",
            border:
              "1px solid " + (verified ? "rgba(92,196,106,0.4)" : "var(--line)"),
            borderRadius: 10,
            padding: 16,
            textAlign: "center",
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-sm)",
            color: verified ? "#9fd9a0" : "var(--fg2)",
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
      "#F39C12", "#E91E8C", "#1ABC9C", "var(--gold)",
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

  // Form styling lives in css/app.css (.onb-lbl / .onb-inp / .onb-help).

  const handleMsg = {
    checking: { t: "Checking…", c: "var(--fg4)" },
    taken: { t: "That handle's taken — try another.", c: "#ff6b6b" },
    ok: { t: "Available", c: "#2ECC71" },
    short: { t: "A little longer, please.", c: "var(--fg4)" },
    "": { t: "", c: "var(--fg4)" },
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
        background: "var(--bg)",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 26 }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 40,
            letterSpacing: 7,
            color: "var(--gold)",
          }}
        >
          ENCORE
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--fs-2xs)",
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
          background: "var(--card)",
          border: "1px solid var(--line)",
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
                background: n === step ? "var(--gold)" : n < step ? "#7a5a1e" : "#262626",
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
                fontFamily: "var(--font-display)",
                fontSize: "var(--fs-3xl)",
                letterSpacing: 1,
                marginBottom: 4,
              }}
            >
              The basics
            </div>
            <div className="onb-help" style={{ marginTop: 0, marginBottom: 22 }}>
              Just a name and a handle. You can change these later.
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="onb-lbl">Your name</label>
              <input
                className="onb-inp"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Kyle Weber"
                maxLength={40}
              />
            </div>

            <div>
              <label className="onb-lbl">Handle</label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 13,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--fg4)",
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--fs-md)",
                  }}
                >
                  @
                </span>
                <input
                  className="onb-inp" style={{ paddingLeft: 26 }}
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
                <div className="onb-help" style={{ color: handleMsg.c }}>{handleMsg.t}</div>
              )}
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!step1Valid}
              style={{
                width: "100%",
                marginTop: 28,
                padding: "13px",
                background: step1Valid ? "var(--gold)" : "var(--line-2)",
                color: step1Valid ? "#000" : "var(--fg4)",
                border: "none",
                borderRadius: 6,
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-md)",
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
                fontFamily: "var(--font-display)",
                fontSize: "var(--fs-3xl)",
                letterSpacing: 1,
                marginBottom: 4,
              }}
            >
              Location & notifications
            </div>
            <div className="onb-help" style={{ marginTop: 0, marginBottom: 22 }}>
              All optional. Email and phone are how friends can ping you when
              they grab tickets — kept private, never shown on your profile.
            </div>
            <div style={{ marginBottom: 18 }}>
              <label className="onb-lbl">City</label>
              <input
                className="onb-inp"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Brooklyn, NY"
                maxLength={60}
              />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label className="onb-lbl">Email for notifications</label>
              <input
                className="onb-inp"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                maxLength={120}
              />
            </div>
            <div>
              <label className="onb-lbl">Phone (for texts)</label>
              <input
                className="onb-inp"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 123 4567"
                maxLength={30}
              />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
              <button onClick={() => setStep(1)} className="onb-back">
                Back
              </button>
              <button onClick={() => setStep(3)} className="onb-next">
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
                fontFamily: "var(--font-display)",
                fontSize: "var(--fs-3xl)",
                letterSpacing: 1,
                marginBottom: 4,
              }}
            >
              Your music taste
            </div>
            <div className="onb-help" style={{ marginTop: 0, marginBottom: 22 }}>
              Optional — pick a few so friends can see what you're into.
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="onb-lbl">Genres</label>
              <TagSearch
                value={genres}
                onChange={setGenres}
                suggestions={GENRES}
                max={8}
                placeholder="House, Techno, Bass…"
              />
            </div>

            <div>
              <label className="onb-lbl">Favorite artists</label>
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
                background: discoverable ? "rgba(245,166,35,.06)" : "var(--panel)",
                border:
                  "1px solid " +
                  (discoverable ? "rgba(245,166,35,.35)" : "var(--line)"),
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
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--fs-md)",
                    fontWeight: 700,
                  }}
                >
                  🔓 Open to Connect
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--fs-2xs)",
                    fontWeight: 700,
                    letterSpacing: 1,
                    padding: "3px 10px",
                    borderRadius: 10,
                    color: discoverable ? "var(--gold)" : "var(--fg4)",
                    border:
                      "1px solid " +
                      (discoverable ? "rgba(245,166,35,.4)" : "var(--line-2)"),
                  }}
                >
                  {discoverable ? "ON" : "OFF"}
                </div>
              </div>
              <div className="onb-help" style={{ marginTop: 8 }}>
                Looking to make friends and hit shows together? Open your
                profile so people who share your taste can find you. When off,
                only friends and people you follow can see you. Change it
                anytime in Edit Profile.
              </div>
            </div>

            {err && (
              <div className="onb-help" style={{ color: "#ff6b6b", marginTop: 16 }}>
                Couldn't save: {err}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
              <button
                onClick={() => setStep(2)}
                disabled={saving}
                className="onb-back"
              >
                Back
              </button>
              <button onClick={finish} disabled={saving} className="onb-next">
                {saving ? "Saving…" : "Finish"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Onboarding nav buttons are styled in css/app.css (.onb-back / .onb-next).
