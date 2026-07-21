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
                  style={{ color: "#F5A623" }}
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
            fontSize: 10,
            fontFamily: "'DM Mono',monospace",
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
    color: user.color || "#F5A623",
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
                background: "#0d0d0d",
                border: "1px solid #1e1e1e",
                borderRadius: 6,
                overflow: "hidden",
              }}
            >
              <span
                style={{
                  padding: "10px 8px 10px 12px",
                  fontFamily: "'DM Mono',monospace",
                  fontSize: 13,
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
                  color: "#F0EDE8",
                  padding: "10px 12px 10px 0",
                  fontFamily: "'Syne',sans-serif",
                  fontSize: 13,
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
            background: draft.discoverable ? "rgba(245,166,35,.06)" : "#0c0c0c",
            border:
              "1px solid " +
              (draft.discoverable ? "rgba(245,166,35,.35)" : "#1e1e1e"),
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
                color: draft.discoverable ? "#F5A623" : "#555",
                border:
                  "1px solid " +
                  (draft.discoverable ? "rgba(245,166,35,.4)" : "#2a2a2a"),
              }}
            >
              {draft.discoverable ? "ON" : "OFF"}
            </div>
          </div>
          <div
            style={{
              fontFamily: "'DM Mono',monospace",
              fontSize: 10,
              color: "#666",
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
            fontFamily: "'DM Mono',monospace",
            fontSize: 10,
            color: "#666",
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
              fontFamily: "'DM Mono',monospace",
              fontSize: 11,
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
                fontFamily: "'DM Mono',monospace",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              Yes, delete all {showCount || 0} shows
            </button>
            <button
              onClick={() => setArmClear(false)}
              style={{
                background: "transparent",
                border: "1px solid #2a2a2a",
                color: "#888",
                padding: "9px 14px",
                borderRadius: 6,
                fontFamily: "'DM Mono',monospace",
                fontSize: 11,
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
              fontFamily: "'DM Mono',monospace",
              fontSize: 10,
              letterSpacing: 2,
              color: "#F5A623",
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
              color: "#555",
              cursor: "pointer",
              fontSize: 14,
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
        background: "#070707",
        textAlign: "center",
      }}
    >
      <div style={{ marginBottom: 40 }}>
        <div
          style={{
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: 48,
            letterSpacing: 8,
            color: "#F5A623",
            marginBottom: 6,
          }}
        >
          ENCORE
        </div>
        <div
          style={{
            fontFamily: "'DM Mono',monospace",
            fontSize: 10,
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
          background: "#111",
          border: "1px solid #1e1e1e",
          borderRadius: 10,
          padding: "40px 32px",
          maxWidth: 360,
          width: "100%",
        }}
      >
        <div
          style={{
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: 26,
            letterSpacing: 2,
            marginBottom: 8,
          }}
        >
          Welcome Back
        </div>
        <div
          style={{
            fontFamily: "'DM Mono',monospace",
            fontSize: 11,
            color: "#555",
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
            fontFamily: "'Syne',sans-serif",
            fontSize: 14,
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
              fontSize: 11,
              color: "#FF5555",
              fontFamily: "'DM Mono',monospace",
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
                fontSize: 11,
                fontFamily: "'DM Mono',monospace",
                color: "#666",
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
              fontSize: 11,
              fontFamily: "'DM Mono',monospace",
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
          fontSize: 10,
          fontFamily: "'DM Mono',monospace",
          color: "#2a2a2a",
          letterSpacing: 0.5,
        }}
      >
        By signing in you agree to our terms. We only read ticket confirmation
        emails.
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
// ── ARTIST SEARCH WIDGET (Spotify-backed, mirrors TagSearch markup) ──────────
// Same look/CSS as TagSearch, but suggestions come from the Netlify Spotify
// proxy instead of a static list. Stores plain artist-name strings.
function ArtistSearch({ value, onChange, max, placeholder }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(
          "/.netlify/functions/spotify-artist-search?q=" + encodeURIComponent(term),
        );
        const d = await r.json();
        setResults(d.artists || []);
      } catch (e) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const add = (name) => {
    if (value.length < max && !value.includes(name)) onChange([...value, name]);
    setQ("");
    setResults([]);
    setOpen(false);
  };
  const remove = (name) => onChange(value.filter((v) => v !== name));
  const handleKey = (e) => {
    if (e.key === "Enter" && q.trim()) {
      e.preventDefault();
      add(q.trim());
    }
    if (e.key === "Escape") setOpen(false);
  };
  const shown = results.filter((a) => !value.includes(a.name)).slice(0, 8);

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
            placeholder={placeholder || "Search artists…"}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={handleKey}
          />
          {open && q.trim().length >= 2 && (
            <div className="tag-drop">
              {loading && shown.length === 0 && (
                <div className="tag-opt" style={{ color: "#555" }}>
                  Searching…
                </div>
              )}
              {shown.map((a) => (
                <div
                  key={a.id || a.name}
                  className="tag-opt"
                  onMouseDown={() => add(a.name)}
                  style={{ display: "flex", alignItems: "center", gap: 10 }}
                >
                  {a.image ? (
                    <img
                      src={a.image}
                      alt=""
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: "#222",
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <span style={{ flex: 1 }}>{a.name}</span>
                  <span className="tag-opt-hint">tap to add</span>
                </div>
              ))}
              {!loading && q.trim().length > 1 && !shown.includes(q.trim()) && (
                <div
                  className="tag-opt"
                  style={{ color: "#F5A623" }}
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
            fontSize: 10,
            fontFamily: "'DM Mono',monospace",
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

// ── OSM (OpenStreetMap / Nominatim) venue + city autocomplete ────────────────
// Hits the keyless place-search Netlify proxy. Picking a result fills the
// venue + city fields below, which stay editable for manual correction.
function PlaceSearch({ onPick, placeholder }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(
          "/.netlify/functions/place-search?q=" + encodeURIComponent(term),
        );
        const d = await r.json();
        setResults(d.places || []);
      } catch (e) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500); // gentle on Nominatim's ~1 req/sec usage policy
    return () => clearTimeout(t);
  }, [q]);

  const pick = (p) => {
    onPick(p);
    setQ("");
    setResults([]);
    setOpen(false);
  };

  return (
    <div className="tag-search-wrap">
      <input
        className="tag-search-inp"
        placeholder={placeholder || "Search venue or address…"}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && q.trim().length >= 3 && (
        <div className="tag-drop">
          {loading && results.length === 0 && (
            <div className="tag-opt" style={{ color: "#555" }}>
              Searching…
            </div>
          )}
          {!loading && results.length === 0 && (
            <div className="tag-opt" style={{ color: "#555" }}>
              No matches — just type it in below.
            </div>
          )}
          {results.map((p, i) => (
            <div
              key={i}
              className="tag-opt"
              onMouseDown={() => pick(p)}
              style={{ display: "block" }}
            >
              <div style={{ color: "#eee" }}>{p.venue || p.city}</div>
              <div
                style={{
                  fontSize: 10,
                  fontFamily: "'DM Mono',monospace",
                  color: "#777",
                  marginTop: 2,
                }}
              >
                {p.full || p.city}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sleek calendar date picker (Encore dark aesthetic, no library) ───────────
function DatePicker({ value, onChange }) {
  const base = value ? new Date(value + "T12:00:00") : new Date();
  const [open, setOpen] = useState(false);
  const [vy, setVy] = useState(base.getFullYear());
  const [vm, setVm] = useState(base.getMonth());

  const MO = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const DOW = ["S", "M", "T", "W", "T", "F", "S"];
  const startDow = new Date(vy, vm, 1).getDay();
  const daysInMonth = new Date(vy, vm + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prev = () => {
    if (vm === 0) {
      setVm(11);
      setVy(vy - 1);
    } else setVm(vm - 1);
  };
  const next = () => {
    if (vm === 11) {
      setVm(0);
      setVy(vy + 1);
    } else setVm(vm + 1);
  };
  const pick = (d) => {
    const mm = String(vm + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    onChange(vy + "-" + mm + "-" + dd);
    setOpen(false);
  };

  const label = value
    ? new Date(value + "T12:00:00").toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Pick a date";

  const navBtn = {
    background: "none",
    border: "none",
    color: "#F5A623",
    fontSize: 20,
    cursor: "pointer",
    padding: "0 8px",
    lineHeight: 1,
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="form-inp"
        style={{
          textAlign: "left",
          cursor: "pointer",
          color: value ? "#eee" : "#666",
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>{label}</span>
        <span style={{ color: "#F5A623" }}>▾</span>
      </button>
      {open && (
        <div
          style={{
            marginTop: 6,
            background: "#0c0c0c",
            border: "1px solid #1e1e1e",
            borderRadius: 8,
            padding: 12,
            width: 268,
            maxWidth: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <button type="button" onClick={prev} style={navBtn}>
              ‹
            </button>
            <div
              style={{
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: 17,
                letterSpacing: 1,
                color: "#eee",
              }}
            >
              {MO[vm]} {vy}
            </div>
            <button type="button" onClick={next} style={navBtn}>
              ›
            </button>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7,1fr)",
              gap: 2,
              marginBottom: 4,
            }}
          >
            {DOW.map((d, i) => (
              <div
                key={i}
                style={{
                  textAlign: "center",
                  fontFamily: "'DM Mono',monospace",
                  fontSize: 9,
                  color: "#555",
                  padding: "2px 0",
                }}
              >
                {d}
              </div>
            ))}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7,1fr)",
              gap: 2,
            }}
          >
            {cells.map((d, i) => {
              if (!d) return <div key={i} />;
              const ds =
                vy +
                "-" +
                String(vm + 1).padStart(2, "0") +
                "-" +
                String(d).padStart(2, "0");
              const isSel = ds === value;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => pick(d)}
                  style={{
                    aspectRatio: "1",
                    border: "none",
                    borderRadius: 5,
                    cursor: "pointer",
                    fontFamily: "'DM Mono',monospace",
                    fontSize: 12,
                    background: isSel ? "#F5A623" : "transparent",
                    color: isSel ? "#000" : "#ccc",
                  }}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── EMAIL-FORWARDING SETUP (auto-tracking) ───────────────────────────────────
// A friendly ~1-minute walkthrough: the user copies their private Encore
// address, adds it to Gmail forwarding (which the backend auto-verifies), and
// creates one filter so only ticket emails forward in.