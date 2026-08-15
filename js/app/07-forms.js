function TagSearch({ value, onChange, suggestions, max, placeholder }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = suggestions
    .filter(
      (s) => s.toLowerCase().includes(q.toLowerCase()) && !value.includes(s),
    )
    .slice(0, 8);
  const add = (tag) => {
    if (value.length < max) onChange([...value, tag]);
    setQ("");
    setOpen(false);
  };
  const remove = (tag) => onChange(value.filter((v) => v !== tag));
  const handleKey = (e) => {
    if (e.key === "Enter" && q.trim()) {
      e.preventDefault();
      add(q.trim());
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  };
  return (
    <div>
      <div className="pill-row">
        {value.map((v) => (
          <div key={v} className="pill">
            {v}
            <button className="pill-x" onClick={() => remove(v)}>
              ×
            </button>
          </div>
        ))}
      </div>
      {value.length < max && (
        <div className="tag-search-wrap">
          <input
            className="tag-search-inp"
            placeholder={placeholder || "Type to search or add…"}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={handleKey}
          />
          {open && q && filtered.length > 0 && (
            <div className="tag-drop">
              {filtered.map((s) => (
                <div key={s} className="tag-opt" onMouseDown={() => add(s)}>
                  {s}
                  <span className="tag-opt-hint">tap to add</span>
                </div>
              ))}
              {!suggestions.includes(q.trim()) && q.trim().length > 1 && (
                <div
                  className="tag-opt"
                  style={{ color: "var(--gold)" }}
                  onMouseDown={() => add(q.trim())}
                >
                  + Add "{q.trim()}"
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {value.length >= max && (
        <div
          style={{
            fontSize: "var(--fs-2xs)",
            fontFamily: "var(--font-mono)",
            color: "#444",
            marginTop: 4,
          }}
        >
          Max {max} reached
        </div>
      )}
    </div>
  );
}

// ── EDIT PROFILE PAGE ─────────────────────────────────────────────────────────
function EditProfilePage({ user, onBack, onSave, onClearShows, showCount }) {
  const [draft, setDraft] = useState({
    name: user.name || "",
    handle: user.handle || "",
    location: user.location || "",
    bio: user.bio || "",
    color: user.color || "var(--gold)",
    genres: [...(user.genres || [])],
    artists: [...(user.artists || [])],
    bucketList: [...(user.bucketList || [])],
    vibe: user.vibe || "both",
    discoverable: !!user.discoverable,
    totalShows: user.totalShows || "",
    social: { instagram: "", ...(user.social || {}) },
  });
  const set = (k, v) => setDraft((p) => ({ ...p, [k]: v }));
  const setSocial = (k, v) =>
    setDraft((p) => ({ ...p, social: { ...p.social, [k]: v } }));
  const bioLen = draft.bio.length;
  const [armClear, setArmClear] = useState(false);

  return (
    <div className="edit-page">
      <div className="edit-hdr">
        <button className="back-btn" onClick={onBack}>
          ←
        </button>
        <span className="edit-hdr-title">Edit Profile</span>
        <button className="edit-save" onClick={() => onSave(draft)}>
          Save
        </button>
      </div>

      {/* AVATAR */}
      <div className="edit-section">
        <div className="edit-sec-title">Avatar</div>
        <div className="av-preview" style={{ background: draft.color }}>
          {draft.name.slice(0, 2).toUpperCase() || "ME"}
        </div>
        <div className="av-grid">
          {AVATAR_COLORS.map((c) => (
            <div
              key={c}
              className={"av-swatch" + (draft.color === c ? " selected" : "")}
              style={{ background: c }}
              onClick={() => set("color", c)}
            />
          ))}
        </div>
      </div>

      {/* BASIC INFO */}
      <div className="edit-section" style={{ marginTop: 20 }}>
        <div className="edit-sec-title">Basic Info</div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <div className="edit-field" style={{ marginBottom: 0 }}>
            <div className="edit-lbl">Display Name</div>
            <input
              className="edit-inp"
              value={draft.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="edit-field" style={{ marginBottom: 0 }}>
            <div className="edit-lbl">Handle</div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "var(--surface-1)",
                border: "1px solid var(--line)",
                borderRadius: 6,
                overflow: "hidden",
              }}
            >
              <span
                style={{
                  padding: "10px 8px 10px 12px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--fs-sm)",
                  color: "#444",
                  flexShrink: 0,
                }}
              >
                @
              </span>
              <input
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  color: "var(--fg)",
                  padding: "10px 12px 10px 0",
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--fs-sm)",
                  outline: "none",
                }}
                value={draft.handle}
                onChange={(e) =>
                  set("handle", e.target.value.replace(/\s/g, ""))
                }
                placeholder="handle"
              />
            </div>
          </div>
        </div>
        <div className="edit-field">
          <div className="edit-lbl">Location</div>
          <input
            className="edit-inp"
            value={draft.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="City, State"
          />
        </div>
        <div className="edit-field">
          <div className="edit-lbl">
            Bio / Quote{" "}
            <span
              style={{
                color: "#333",
                textTransform: "none",
                fontWeight: 400,
                letterSpacing: 0,
              }}
            >
              (shown on your profile)
            </span>
          </div>
          <textarea
            className="edit-textarea"
            rows={3}
            maxLength={160}
            value={draft.bio}
            onChange={(e) => set("bio", e.target.value)}
            placeholder="What drives your concert obsession?"
          />
          <div className={"char-cnt" + (bioLen > 140 ? " warn" : "")}>
            {bioLen}/160
          </div>
        </div>
        <div className="edit-field">
          <div className="edit-lbl">
            Total Shows Attended{" "}
            <span
              style={{
                color: "#333",
                textTransform: "none",
                fontWeight: 400,
                letterSpacing: 0,
              }}
            >
              (lifetime, including pre-app)
            </span>
          </div>
          <input
            className="edit-inp"
            type="number"
            min="0"
            value={draft.totalShows}
            onChange={(e) => set("totalShows", e.target.value)}
            placeholder="e.g. 47"
          />
        </div>
      </div>

      {/* MUSIC TASTE */}
      <div className="edit-section" style={{ marginTop: 20 }}>
        <div className="edit-sec-title">Privacy</div>
        <div
          onClick={() => set("discoverable", !draft.discoverable)}
          style={{
            padding: "14px 15px",
            background: draft.discoverable ? "color-mix(in srgb,var(--gold) 6%,transparent)" : "var(--panel)",
            border:
              "1px solid " +
              (draft.discoverable ? "color-mix(in srgb,var(--gold) 35%,transparent)" : "var(--line)"),
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
                color: draft.discoverable ? "var(--gold)" : "var(--fg4)",
                border:
                  "1px solid " +
                  (draft.discoverable ? "color-mix(in srgb,var(--gold) 40%,transparent)" : "var(--line-2)"),
              }}
            >
              {draft.discoverable ? "ON" : "OFF"}
            </div>
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--fs-2xs)",
              color: "var(--fg3)",
              marginTop: 8,
              lineHeight: 1.6,
            }}
          >
            {draft.discoverable
              ? "Your profile, genres, and upcoming shows are visible to everyone. Strangers only ever see past shows you both attended."
              : "Only friends and people you follow can see your profile. You won't appear in genre pages or search."}
          </div>
        </div>
      </div>

      <div className="edit-section" style={{ marginTop: 20 }}>
        <div className="edit-sec-title">Music Taste</div>

        <div className="edit-field">
          <div className="edit-lbl">Genres</div>
          <TagSearch
            value={draft.genres}
            onChange={(v) => set("genres", v)}
            suggestions={GENRES}
            max={8}
            placeholder="House, Techno, Bass…"
          />
        </div>

        <div className="edit-field">
          <div className="edit-lbl">
            Favorite Artists{" "}
            <span
              style={{
                color: "#333",
                textTransform: "none",
                fontWeight: 400,
                letterSpacing: 0,
              }}
            >
              (up to 5)
            </span>
          </div>
          <TagSearch
            value={draft.artists}
            onChange={(v) => set("artists", v)}
            suggestions={ARTIST_SUGG}
            max={5}
            placeholder="Search artists…"
          />
        </div>

        <div className="edit-field">
          <div className="edit-lbl">
            🎯 Bucket List{" "}
            <span
              style={{
                color: "#333",
                textTransform: "none",
                fontWeight: 400,
                letterSpacing: 0,
              }}
            >
              (artists you want to see live — up to 5)
            </span>
          </div>
          <TagSearch
            value={draft.bucketList}
            onChange={(v) => set("bucketList", v)}
            suggestions={ARTIST_SUGG}
            max={5}
            placeholder="Who do you need to see before you die?"
          />
        </div>

        <div className="edit-field">
          <div className="edit-lbl">Show Vibe</div>
          <div className="vibe-row">
            {[
              ["clubs", "🏠 Clubs"],
              ["both", "⚡ Both"],
              ["festivals", "🌅 Festivals"],
            ].map(([v, l]) => (
              <button
                key={v}
                className={"vibe-btn" + (draft.vibe === v ? " on" : "")}
                onClick={() => set("vibe", v)}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SOCIAL */}
      <div
        className="edit-section"
        style={{ marginTop: 20, paddingBottom: 20 }}
      >
        <div className="edit-sec-title">Social Links</div>
        <div className="edit-lbl" style={{ marginBottom: 6 }}>
          Instagram
        </div>
        <div className="social-row" style={{ marginBottom: 10 }}>
          <span className="social-prefix">instagram.com/</span>
          <input
            className="social-inp"
            value={draft.social.instagram}
            onChange={(e) => setSocial("instagram", e.target.value)}
            placeholder="yourhandle"
          />
        </div>
        <div className="edit-lbl" style={{ marginBottom: 6 }}>
          Spotify
        </div>
        <div className="social-row" style={{ marginBottom: 10 }}>
          <span className="social-prefix">spotify.com/user/</span>
          <input
            className="social-inp"
            value={draft.social.spotify}
            onChange={(e) => setSocial("spotify", e.target.value)}
            placeholder="your-user-id"
          />
        </div>
        <div className="edit-lbl" style={{ marginBottom: 6 }}>
          SoundCloud
        </div>
        <div className="social-row">
          <span className="social-prefix">soundcloud.com/</span>
          <input
            className="social-inp"
            value={draft.social.soundcloud}
            onChange={(e) => setSocial("soundcloud", e.target.value)}
            placeholder="yourhandle"
          />
        </div>
      </div>

      {/* DANGER ZONE */}
      <div
        className="edit-section"
        style={{ marginTop: 20, paddingBottom: 24 }}
      >
        <div className="edit-sec-title" style={{ color: "#ff6b6b" }}>
          Danger Zone
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--fs-2xs)",
            color: "var(--fg3)",
            lineHeight: 1.6,
            marginBottom: 10,
          }}
        >
          Deletes all {showCount || 0} of your shows — history, stats, the
          lot. They come back if you re-forward your ticket emails (or add
          shows manually). Follows, messages, and your profile are untouched.
        </div>
        {!armClear ? (
          <button
            onClick={() => setArmClear(true)}
            style={{
              background: "transparent",
              border: "1px solid #442222",
              color: "#ff6b6b",
              padding: "9px 14px",
              borderRadius: 6,
              fontFamily: "var(--font-mono)",
              fontSize: "var(--fs-xs)",
              cursor: "pointer",
            }}
          >
            ⌫ Clear all my shows…
          </button>
        ) : (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={() => {
                setArmClear(false);
                onClearShows && onClearShows();
              }}
              style={{
                background: "rgba(255,107,107,.12)",
                border: "1px solid #ff6b6b",
                color: "#ff6b6b",
                padding: "9px 14px",
                borderRadius: 6,
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-xs)",
                cursor: "pointer",
              }}
            >
              Yes, delete all {showCount || 0} shows
            </button>
            <button
              onClick={() => setArmClear(false)}
              style={{
                background: "transparent",
                border: "1px solid var(--line-2)",
                color: "var(--fg2)",
                padding: "9px 14px",
                borderRadius: 6,
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-xs)",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── SEARCH / DISCOVER PAGE ────────────────────────────────────────────────────
function SearchPage({
  users,
  curUser,
  concerts,
  onFollowToggle,
  onViewProfile,
  onGenreClick,
}) {
  const [q, setQ] = useState("");
  const [genreFilter, setGenreFilter] = useState(null);
  const others = users.filter((u) => u.id !== curUser.id);
  const results = others.filter((u) => {
    const matchQ =
      !q ||
      u.name.toLowerCase().includes(q.toLowerCase()) ||
      u.handle.toLowerCase().includes(q.toLowerCase()) ||
      u.location.toLowerCase().includes(q.toLowerCase());
    const matchG = !genreFilter || (u.genres || []).includes(genreFilter);
    return matchQ && matchG;
  });
  const mutualCount = (u2) =>
    concerts.filter(
      (c) =>
        (c.attendees || []).includes(curUser.id) &&
        (c.attendees || []).includes(u2.id),
    ).length;
  // Match-ranked strangers: strongest overlap first, people I follow excluded.
  const likeYou = others
    .map((u2) => ({ u2, mi: matchInfo(curUser, u2, concerts) }))
    .filter(
      (x) => x.mi.score > 0 && !(curUser.following || []).includes(x.u2.id),
    )
    .sort((a, b) => b.mi.score - a.mi.score)
    .slice(0, 5);
  return (
    <div className="search-page">
      <div className="pg-head">
        <div className="pg-title">Discover</div>
      </div>
      {curUser.id && likeYou.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--fs-2xs)",
              letterSpacing: 2,
              color: "var(--gold)",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            ⚡ People like you
          </div>
          {likeYou.map(({ u2, mi }) => (
            <div
              key={u2.id}
              className="user-card"
              onClick={() => onViewProfile(u2.id)}
            >
              <div className="uc-av" style={{ background: u2.color }}>
                {u2.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="uc-info">
                <div className="uc-name">{u2.name}</div>
                <div className="uc-handle">
                  @{u2.handle}
                  {u2.location ? " · " + u2.location : ""}
                </div>
                {mi.line && <div className="uc-mutual">{mi.line}</div>}
              </div>
              <button
                className="uc-follow ucf-n"
                onClick={(e) => {
                  e.stopPropagation();
                  onFollowToggle(u2.id);
                }}
              >
                Follow
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="search-box">
        <span className="search-icon">⌕</span>
        <input
          className="search-inp"
          placeholder="Search by name, handle, or city…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {q && (
          <button
            style={{
              background: "none",
              border: "none",
              color: "var(--fg4)",
              cursor: "pointer",
              fontSize: "var(--fs-md)",
            }}
            onClick={() => setQ("")}
          >
            ×
          </button>
        )}
      </div>
      <div className="search-tags">
        {GENRES.slice(0, 8).map((g) => (
          <button
            key={g}
            className={"search-tag" + (genreFilter === g ? " on" : "")}
            onClick={() => setGenreFilter(genreFilter === g ? null : g)}
          >
            {g}
          </button>
        ))}
      </div>
      {results.length === 0 && (
        <div className="empty">
          <div className="empty-i">🔍</div>
          <div className="empty-t">No Results</div>
          <div className="empty-s">Try a different name or genre filter.</div>
        </div>
      )}
      {results.map((u2) => {
        const isF = curUser.following.includes(u2.id);
        const mc = mutualCount(u2);
        return (
          <div
            key={u2.id}
            className="user-card"
            onClick={() => onViewProfile(u2.id)}
          >
            <div className="uc-av" style={{ background: u2.color }}>
              {u2.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="uc-info">
              <div className="uc-name">{u2.name}</div>
              <div className="uc-handle">
                @{u2.handle} · {u2.location}
              </div>
              <div className="uc-genres">
                {(u2.genres || []).map((g) => (
                  <span
                    key={g}
                    className="uc-genre"
                    onClick={(e) => {
                      e.stopPropagation();
                      onGenreClick && onGenreClick(g);
                    }}
                    title={"Explore " + g}
                  >
                    {g}
                  </span>
                ))}
              </div>
              {mc > 0 && (
                <div className="uc-mutual">
                  🎟 {mc} mutual show{mc !== 1 ? "s" : ""}
                </div>
              )}
            </div>
            <button
              className={"uc-follow " + (isF ? "ucf-y" : "ucf-n")}
              onClick={(e) => {
                e.stopPropagation();
                onFollowToggle(u2.id);
              }}
            >
              {isF ? "Following" : "Follow"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ── LOGIN PAGE ───────────────────────────────────────────────────────────────
function LoginPage({ onBack }) {
  const [loading, setLoading] = useState(null); // provider id while redirecting
  const [error, setError] = useState(null);

  const signIn = async (provider) => {
    setLoading(provider);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: "https://encorefriends.com/app.html" },
    });
    if (error) {
      setError(error.message);
      setLoading(null);
    }
  };

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
        textAlign: "center",
      }}
    >
      <div style={{ marginBottom: 40 }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 48,
            letterSpacing: 8,
            color: "var(--gold)",
            marginBottom: 6,
          }}
        >
          ENCORE
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--fs-2xs)",
            letterSpacing: 4,
            color: "#444",
            textTransform: "uppercase",
          }}
        >
          Concert Tracker
        </div>
      </div>
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--line)",
          borderRadius: 10,
          padding: "40px 32px",
          maxWidth: 360,
          width: "100%",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 26,
            letterSpacing: 2,
            marginBottom: 8,
          }}
        >
          Welcome Back
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--fs-xs)",
            color: "var(--fg4)",
            marginBottom: 32,
            lineHeight: 1.6,
          }}
        >
          Sign in to track shows, follow friends, and never miss a concert.
        </div>
        {(() => {
          const btn = (bg, fg, border) => ({
            width: "100%",
            padding: "13px 20px",
            background: bg,
            color: fg,
            border: border || "none",
            borderRadius: 6,
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-md)",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            opacity: loading ? 0.6 : 1,
            marginBottom: 10,
            transition: "all .15s",
          });
          const marks = {
            google: (
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            ),
            apple: (
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09z" />
              </svg>
            ),
            facebook: (
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
              </svg>
            ),
          };
          const skin = {
            google: ["#fff", "#000", null],
            apple: ["#000", "#fff", "1px solid #333"],
            facebook: ["#1877F2", "#fff", null],
          };
          const name = { google: "Google", apple: "Apple", facebook: "Facebook" };
          return AUTH_PROVIDERS.filter((p) => marks[p]).map((p) => (
            <button
              key={p}
              onClick={() => signIn(p)}
              disabled={!!loading}
              style={btn(...skin[p])}
            >
              {marks[p]}
              {loading === p ? "Signing in…" : "Continue with " + name[p]}
            </button>
          ));
        })()}
        {error && (
          <div
            style={{
              fontSize: "var(--fs-xs)",
              color: "#FF5555",
              fontFamily: "var(--font-mono)",
              marginBottom: 12,
            }}
          >
            {error}
          </div>
        )}
        <div
          style={{
            borderTop: "1px solid #1a1a1a",
            paddingTop: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {onBack && (
            <button
              onClick={onBack}
              style={{
                background: "none",
                border: "none",
                fontSize: "var(--fs-xs)",
                fontFamily: "var(--font-mono)",
                color: "var(--fg3)",
                cursor: "pointer",
                letterSpacing: 0.5,
              }}
            >
              ← Keep browsing as guest
            </button>
          )}
          <a
            href="index.html"
            style={{
              fontSize: "var(--fs-xs)",
              fontFamily: "var(--font-mono)",
              color: "#444",
              textDecoration: "none",
              letterSpacing: 0.5,
            }}
          >
            ← Back to encorefriends.com
          </a>
        </div>
      </div>
      <div
        style={{
          marginTop: 24,
          fontSize: "var(--fs-2xs)",
          fontFamily: "var(--font-mono)",
          color: "var(--line-2)",
          letterSpacing: 0.5,
        }}
      >
        By signing in you agree to our terms. We only read ticket confirmation
        emails.
      </div>
    </div>
  );
}
