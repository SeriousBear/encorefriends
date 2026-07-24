function GenreSearch({ onGenreClick }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const matches = q.trim()
    ? GENRES.filter((g) =>
        g.toLowerCase().includes(q.trim().toLowerCase()),
      ).slice(0, 12)
    : [];
  return (
    <div style={{ position: "relative", margin: "14px 0 4px" }}>
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="⌕ Search any genre — find your people"
        style={{
          width: "100%",
          background: "#0c0c0c",
          border: "1px solid #1e1e1e",
          borderRadius: 6,
          color: "#f0ede8",
          fontFamily: "'DM Mono',monospace",
          fontSize: 12,
          padding: "10px 12px",
          outline: "none",
          boxSizing: "border-box",
        }}
      />
      {open && matches.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 30,
            marginTop: 4,
            background: "#111",
            border: "1px solid #222",
            borderRadius: 6,
            overflow: "hidden",
            boxShadow: "0 8px 24px rgba(0,0,0,.5)",
          }}
        >
          {matches.map((g) => (
            <div
              key={g}
              onMouseDown={() => {
                setQ("");
                setOpen(false);
                onGenreClick && onGenreClick(g);
              }}
              style={{
                padding: "9px 12px",
                fontFamily: "'Syne',sans-serif",
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #1a1a1a",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "rgba(245,166,35,.07)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "";
              }}
            >
              <span>{g}</span>
              <span
                style={{
                  fontFamily: "'DM Mono',monospace",
                  fontSize: 9,
                  color: "#555",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                {GENRE_PARENT_OF[g] ||
                  (GENRE_TAXONOMY[g] || []).length + " subgenres"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfilePage({
  user,
  curUser,
  concerts,
  pastShows,
  users,
  onBack,
  onFollowToggle,
  onOpenConcert,
  onViewProfile,
  onEdit,
  onMessage,
  onGenreClick,
  onArtistClick,
}) {
  const [tab, setTab] = useState("upcoming");
  const [connModal, setConnModal] = useState(null); // null | "followers" | "following"
  const isSelf = user.id === curUser.id;
  const isFollowing = curUser.following.includes(user.id);
  // Shows this user attends, split by date (festivals count as upcoming
  // until their end_date passes). History = real past concerts + legacy seed.
  const attending = concerts.filter((c) =>
    (c.attendees || []).includes(user.id),
  );
  const upcoming = attending
    .filter((c) => daysUntil(c.end_date || c.date) >= 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const past = [
    ...attending.filter((c) => daysUntil(c.end_date || c.date) < 0),
    ...pastShows.filter((p) => user.past?.includes(p.id)),
  ];
  const mutualUpcoming = upcoming.filter(
    (c) => (c.attendees || []).includes(curUser.id) && user.id !== curUser.id,
  );
  const followers = users.filter((u) => u.following.includes(user.id));
  const followingUsers = users.filter((u) => user.following.includes(u.id));
  const connList = connModal === "followers" ? followers : followingUsers;
  return (
    <div className="prof-page">
      <div className="prof-hdr">
        <button className="back-btn" onClick={onBack}>
          ←
        </button>
        <span className="prof-hdr-name">{user.name}</span>
        {!isSelf && (
          <button
            className={
              "prof-follow-btn " + (isFollowing ? "pf-following" : "pf-follow")
            }
            onClick={() => onFollowToggle(user.id)}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        )}
        {!isSelf && onMessage && (
          <button
            className="prof-follow-btn pf-follow"
            style={{
              background: "transparent",
              border: "1px solid #2a2a2a",
              color: "#aaa",
              marginLeft: 6,
            }}
            onClick={() => onMessage(user.id)}
          >
            ✉ Message
          </button>
        )}
        {isSelf && (
          <button
            className="prof-follow-btn pf-follow"
            style={{
              background: "transparent",
              border: "1px solid rgba(245,166,35,.3)",
              color: "#F5A623",
            }}
            onClick={onEdit}
          >
            Edit Profile
          </button>
        )}
      </div>
      <div className="prof-hero">
        <div className="prof-top">
          <div className="prof-av" style={{ background: user.color }}>
            {user.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="prof-info">
            <div className="prof-name">{user.name}</div>
            <div className="prof-handle">@{user.handle}</div>
            <div className="prof-loc">📍 {user.location}</div>
          </div>
        </div>
        {user.bio && <div className="prof-bio">"{user.bio}"</div>}
        <div className="genre-row">
          {(user.genres || []).map((g) => (
            <span
              key={g}
              className="genre-tag"
              onClick={() => onGenreClick && onGenreClick(g)}
              title={"Explore " + g}
            >
              {g}
            </span>
          ))}
        </div>
        {isSelf && <GenreSearch onGenreClick={onGenreClick} />}
        {(user.artists || []).length > 0 && (
          <div>
            <div className="prof-subsec">Favorite Artists</div>
            <div className="prof-artists">
              {user.artists.map((a) => (
                <span
                  key={a}
                  className="prof-art-pill"
                  onClick={() => onArtistClick && onArtistClick(a)}
                  title={"Explore " + a}
                >
                  ♪ {a}
                </span>
              ))}
            </div>
          </div>
        )}
        {(user.bucketList || []).length > 0 && (
          <div>
            <div className="prof-subsec">🎯 Bucket List</div>
            <div className="prof-artists">
              {user.bucketList.map((a) => (
                <span
                  key={a}
                  className="prof-bucket-pill"
                  onClick={() => onArtistClick && onArtistClick(a)}
                  title={"Explore " + a}
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="prof-stats">
          <div className="stat">
            <div className="stat-n">
              {past.length +
                (user.ratings ? Object.keys(user.ratings).length : 0)}
            </div>
            <div className="stat-l">Shows</div>
          </div>
          <div className="stat">
            <div className="stat-n">{upcoming.length}</div>
            <div className="stat-l">Upcoming</div>
          </div>
          <div
            className="stat stat-tap"
            onClick={() => setConnModal("followers")}
            title="View followers"
          >
            <div className="stat-n">{followers.length}</div>
            <div className="stat-l">Followers</div>
          </div>
          <div
            className="stat stat-tap"
            onClick={() => setConnModal("following")}
            title="View following"
          >
            <div className="stat-n">{followingUsers.length}</div>
            <div className="stat-l">Following</div>
          </div>
        </div>
        {user.social &&
          (user.social.instagram ||
            user.social.spotify ||
            user.social.soundcloud) && (
            <div className="prof-social-row" style={{ marginTop: 12 }}>
              {user.social.instagram && (
                <a
                  className="prof-social-link"
                  href={"https://instagram.com/" + user.social.instagram}
                  target="_blank"
                  rel="noreferrer"
                >
                  ig/{user.social.instagram}
                </a>
              )}
              {user.social.spotify && (
                <a
                  className="prof-social-link"
                  href={"https://open.spotify.com/user/" + user.social.spotify}
                  target="_blank"
                  rel="noreferrer"
                >
                  spotify
                </a>
              )}
              {user.social.soundcloud && (
                <a
                  className="prof-social-link"
                  href={"https://soundcloud.com/" + user.social.soundcloud}
                  target="_blank"
                  rel="noreferrer"
                >
                  sc/{user.social.soundcloud}
                </a>
              )}
            </div>
          )}
        {user.vibe && (
          <div style={{ marginTop: 8 }}>
            <span className="prof-vibe-badge">
              {user.vibe === "clubs"
                ? "🏠 clubs"
                : user.vibe === "festivals"
                  ? "🌅 festivals"
                  : "⚡ clubs + festivals"}
            </span>
          </div>
        )}
      </div>
      {mutualUpcoming.length > 0 && (
        <div style={{ padding: "12px 18px" }}>
          <div className="mutual-banner">
            <div className="mutual-title">
              🎟 You're both going to {mutualUpcoming.length} show
              {mutualUpcoming.length !== 1 ? "s" : ""}
            </div>
            {mutualUpcoming.map((c) => (
              <div key={c.id} className="mutual-show">
                <div className="mutual-dot" />
                <span>{c.artist}</span>
                <span
                  style={{
                    fontSize: 9,
                    fontFamily: "'DM Mono',monospace",
                    color: "#888",
                    marginLeft: "auto",
                  }}
                >
                  {fmt(c.date).mo} {fmt(c.date).day}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="prof-tabs">
        <button
          className={"prof-tab" + (tab === "upcoming" ? " on" : "")}
          onClick={() => setTab("upcoming")}
        >
          Upcoming ({upcoming.length})
        </button>
        <button
          className={"prof-tab" + (tab === "history" ? " on" : "")}
          onClick={() => setTab("history")}
        >
          History ({past.length})
        </button>
      </div>
      <div className="prof-content">
        {tab === "upcoming" &&
          (upcoming.length === 0 ? (
            <div className="empty">
              <div className="empty-i">🎵</div>
              <div className="empty-t">No Upcoming Shows</div>
              <div className="empty-s">
                {isSelf
                  ? "Add a show or forward a ticket to track it."
                  : user.name + " hasn't tagged any upcoming shows yet."}
              </div>
            </div>
          ) : (
            <div className="grid">
              {upcoming.map((c) => (
                <CCard
                  key={c.id}
                  c={c}
                  users={users}
                  curUser={curUser}
                  onOpen={onOpenConcert}
                  onToggleGoing={() => {}}
                  onViewProfile={onViewProfile}
                  onGenreClick={onGenreClick}
                />
              ))}
            </div>
          ))}
        {tab === "history" &&
          (past.length === 0 ? (
            <div className="empty">
              <div className="empty-i">📅</div>
              <div className="empty-t">No History Yet</div>
              <div className="empty-s">Past shows will appear here.</div>
            </div>
          ) : (
            <div>
              {past
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((p) => {
                  const d = fmt(p.date),
                    rating = user.ratings?.[p.id] || 0;
                  return (
                    <div key={p.id} className="past-item">
                      <div className="past-dbdg">
                        <div className="past-mo">{d.mo}</div>
                        <div className="past-dy">{d.day}</div>
                      </div>
                      <div className="past-info">
                        <div className="past-artist">{p.artist}</div>
                        <div className="past-venue">
                          {p.venue} · {p.city}
                        </div>
                      </div>
                      {rating > 0 && (
                        <div className="past-stars">{stars(rating)}</div>
                      )}
                    </div>
                  );
                })}
            </div>
          ))}
      </div>

      {/* ── FOLLOWERS / FOLLOWING MODAL ── */}
      {connModal && (
        <div className="mwrap" onClick={() => setConnModal(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-bar" style={{ background: "#F5A623" }} />
            <div className="sheet-handle" />
            <div className="sheet-body">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <div className="sh-artist" style={{ marginBottom: 0 }}>
                  {connModal === "followers" ? "Followers" : "Following"}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    style={{
                      padding: "5px 12px",
                      borderRadius: 14,
                      fontFamily: "'Syne',sans-serif",
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      cursor: "pointer",
                      border: "none",
                      transition: "all .15s",
                      background:
                        connModal === "followers"
                          ? "#F5A623"
                          : "rgba(245,166,35,.1)",
                      color: connModal === "followers" ? "#000" : "#F5A623",
                    }}
                    onClick={() => setConnModal("followers")}
                  >
                    Followers {followers.length}
                  </button>
                  <button
                    style={{
                      padding: "5px 12px",
                      borderRadius: 14,
                      fontFamily: "'Syne',sans-serif",
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      cursor: "pointer",
                      border: "none",
                      transition: "all .15s",
                      background:
                        connModal === "following"
                          ? "#F5A623"
                          : "rgba(245,166,35,.1)",
                      color: connModal === "following" ? "#000" : "#F5A623",
                    }}
                    onClick={() => setConnModal("following")}
                  >
                    Following {followingUsers.length}
                  </button>
                </div>
              </div>
              {connList.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "32px 0",
                    color: "#333",
                    fontFamily: "'DM Mono',monospace",
                    fontSize: 11,
                  }}
                >
                  {connModal === "followers"
                    ? "No followers yet"
                    : "Not following anyone yet"}
                </div>
              )}
              {connList.map((u2) => {
                const isF = curUser.following.includes(u2.id);
                const isSelf2 = u2.id === curUser.id;
                return (
                  <div
                    key={u2.id}
                    className="conn-item"
                    onClick={() => {
                      setConnModal(null);
                      onViewProfile && onViewProfile(u2.id);
                    }}
                  >
                    <div className="conn-av" style={{ background: u2.color }}>
                      {u2.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="conn-info">
                      <div className="conn-name">{u2.name}</div>
                      <div className="conn-sub">
                        @{u2.handle} · {u2.location}
                      </div>
                    </div>
                    {!isSelf2 && (
                      <button
                        className={"conn-flw " + (isF ? "cfy" : "cfn")}
                        onClick={(e) => {
                          e.stopPropagation();
                          onFollowToggle(u2.id);
                        }}
                      >
                        {isF ? "Following" : "Follow"}
                      </button>
                    )}
                  </div>
                );
              })}
              <button className="sh-close" onClick={() => setConnModal(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ARTIST SHEET ─────────────────────────────────────────────────────────────
// Shows upcoming concerts + streaming links for a given artist name
function ArtistSheet({ artistName, concerts, onClose, onOpenConcert }) {
  // fuzzy match: "Subtronics" matches "Subtronics b2b GRiZ"
  const slug = artistName.toLowerCase();
  const shows = concerts.filter(
    (c) =>
      c.artist.toLowerCase().includes(slug) ||
      slug.includes(c.artist.toLowerCase().split(" ")[0]),
  );
  return (
    <div className="mwrap" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-bar" style={{ background: "#F5A623" }} />
        <div className="sheet-handle" />
        <div className="sheet-body">
          <div className="sh-artist">{artistName}</div>
          <div className="sh-lbl nb">Upcoming Shows</div>
          {shows.length === 0 ? (
            <div className="art-no-shows">
              No upcoming shows in your feed for this artist.
              <br />
              Check the streaming links or resale sites below.
            </div>
          ) : (
            <div className="art-shows-list">
              {shows.map((c) => {
                const d = fmt(c.date),
                  u = getUrgency(c.date),
                  dy = daysUntil(c.date);
                return (
                  <div
                    key={c.id}
                    className="art-show-row"
                    style={{
                      borderColor:
                        u === "urgent"
                          ? "rgba(255,80,80,.3)"
                          : u === "soon"
                            ? "rgba(245,166,35,.25)"
                            : "#1e1e1e",
                    }}
                  >
                    <div className="art-show-info">
                      <div className="art-show-artist">{c.venue}</div>
                      <div className="art-show-venue">{c.city}</div>
                    </div>
                    <div className="art-show-date">
                      {d.mo} {d.day}
                    </div>
                    {primaryUrl(c) && (
                      <a
                        className="art-show-btn"
                        href={primaryUrl(c)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Tickets ↗
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div className="sh-lbl">Listen to {artistName}</div>
          <div className="sg">
            {STREAMS.map((s) => (
              <a
                key={s.name}
                className="sl"
                href={s.url(artistName)}
                target="_blank"
                rel="noreferrer"
                style={{ background: s.bg, border: "1px solid " + s.border }}
              >
                <div className="sdot" style={{ background: s.color }} />
                <span className="sn" style={{ color: s.color }}>
                  {s.name}
                </span>
                <span className="sa">↗</span>
              </a>
            ))}
          </div>
          <button className="sh-close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── TOUR (personal stats) ─────────────────────────────────────────────────────
// A live recap of the shows you've been to: lifetime stats, a genre "passport"
// of styles you've heard live, bucket-list progress, and the friends you keep
// crossing paths with. All computed client-side from the concerts already
// loaded — no extra queries. Named "Tour" (not "Wrapped") and works year-round.
function TourPage({
  user,
  concerts,
  users,
  onBack,
  onArtistClick,
  onGenreClick,
  onViewProfile,
}) {
  const [copied, setCopied] = useState(false);

  const uniq = (arr) => [...new Set(arr.filter((x) => x && x.trim()))];
  const norm = (s) => String(s || "").trim().toLowerCase();
  const yearOf = (d) => new Date(d + "T12:00:00").getFullYear();

  const mine = (concerts || []).filter((c) =>
    (c.attendees || []).includes(user.id),
  );
  const past = mine.filter((c) => daysUntil(c.date) < 0);
  const upcoming = mine
    .filter((c) => daysUntil(c.date) >= 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const thisYear = new Date().getFullYear();
  const showsThisYear = mine.filter((c) => yearOf(c.date) === thisYear).length;
  const artists = uniq(mine.map((c) => c.artist));
  const cities = uniq(mine.map((c) => c.city));
  const venues = uniq(mine.map((c) => c.venue));
  const festivals = mine.filter((c) => c.is_festival).length;
  const yearsActive = uniq(mine.map((c) => String(yearOf(c.date)))).length;
  const firstShow = [...mine].sort(
    (a, b) => new Date(a.date) - new Date(b.date),
  )[0];
  const nextShow = upcoming[0];

  // Most-seen artist and most-visited city.
  const rank = (key) => {
    const m = {};
    mine.forEach((c) => {
      const v = (c[key] || "").trim();
      if (v) m[v] = (m[v] || 0) + 1;
    });
    return Object.entries(m).sort((a, b) => b[1] - a[1])[0]; // [value, count] | undefined
  };
  const topArtist = rank("artist");
  const topCity = rank("city");

  // Top genre families — roll subgenres up to their parent for a clean top list.
  const famCounts = {};
  mine.forEach((c) =>
    (c.genres || []).forEach((g) => {
      const fam = GENRE_PARENT_OF[g] || g;
      famCounts[fam] = (famCounts[fam] || 0) + 1;
    }),
  );
  const topGenres = Object.entries(famCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Genre Passport — which styles you've actually heard live (past shows).
  const seenGenres = new Set();
  past.forEach((c) => (c.genres || []).forEach((g) => seenGenres.add(g)));
  const passport = GENRE_PARENTS.map((p) => {
    const pool = [p, ...(GENRE_TAXONOMY[p] || [])];
    return { fam: p, hit: pool.filter((g) => seenGenres.has(g)).length };
  })
    .filter((x) => x.hit > 0)
    .sort((a, b) => b.hit - a.hit);
  const maxFam = passport.length ? passport[0].hit : 1;

  // Bucket list — seen vs still chasing, and a 🎟 flag when a ticket's inbound.
  const seenArtists = new Set(past.map((c) => norm(c.artist)));
  const upArtists = new Set(upcoming.map((c) => norm(c.artist)));
  const bucket = (user.bucketList || []).map((a) => ({
    name: a,
    seen: seenArtists.has(norm(a)),
    inbound: !seenArtists.has(norm(a)) && upArtists.has(norm(a)),
  }));
  const bucketSeen = bucket.filter((b) => b.seen).length;

  // Friends you keep crossing paths with — reuse the shared matchInfo signal.
  const friends = (users || [])
    .filter((u) => u.id !== user.id && (user.following || []).includes(u.id))
    .map((u) => ({ u, ...matchInfo(user, u, concerts) }))
    .filter((x) => x.line)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const shareText =
    "My Encore Tour: " +
    mine.length +
    " shows · " +
    artists.length +
    " artists · " +
    cities.length +
    " cities" +
    (topGenres[0] ? " · mostly " + topGenres[0][0] : "") +
    " — encorefriends.com";
  const onShare = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: "My Encore Tour",
          text: shareText,
          url: "https://encorefriends.com",
        });
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch (e) {
      /* user dismissed the share sheet — nothing to do */
    }
  };

  const sub = {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 2,
    color: "#666",
    textTransform: "uppercase",
    margin: "22px 0 8px",
    fontFamily: "'DM Mono',monospace",
  };
  const card = {
    background: "#111",
    border: "1px solid #1e1e1e",
    borderRadius: 10,
    padding: 14,
  };
  const chip = {
    display: "inline-block",
    padding: "5px 10px",
    margin: "0 6px 6px 0",
    borderRadius: 999,
    fontSize: 12,
    fontFamily: "'DM Mono',monospace",
    cursor: "pointer",
  };

  return (
    <div className="prof-page">
      <div className="prof-hdr">
        <button className="back-btn" onClick={onBack}>
          ←
        </button>
        <span className="prof-hdr-name">Your Tour</span>
      </div>

      <div style={{ padding: "4px 14px 40px" }}>
        {mine.length === 0 ? (
          <div style={{ ...card, textAlign: "center", padding: 28 }}>
            <div
              style={{
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: 30,
                color: "#F5A623",
                letterSpacing: 1,
              }}
            >
              Your tour starts here
            </div>
            <div
              style={{
                fontFamily: "'Syne',sans-serif",
                color: "#aaa",
                fontSize: 14,
                marginTop: 8,
                lineHeight: 1.5,
              }}
            >
              Forward a ticket email and your first show lands here — then this
              page fills in with your stats, genres, and bucket-list progress.
            </div>
          </div>
        ) : (
          <>
            {/* HERO NUMBERS */}
            <div className="prof-stats" style={{ marginTop: 6 }}>
              <div className="stat">
                <div className="stat-n">{mine.length}</div>
                <div className="stat-l">Shows</div>
              </div>
              <div className="stat">
                <div className="stat-n">{artists.length}</div>
                <div className="stat-l">Artists</div>
              </div>
              <div className="stat">
                <div className="stat-n">{cities.length}</div>
                <div className="stat-l">Cities</div>
              </div>
              <div className="stat">
                <div className="stat-n">{venues.length}</div>
                <div className="stat-l">Venues</div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 18,
                flexWrap: "wrap",
                marginTop: 12,
                fontFamily: "'Syne',sans-serif",
                fontSize: 13,
                color: "#ccc",
              }}
            >
              <span>
                <b style={{ color: "#F5A623" }}>{showsThisYear}</b> in {thisYear}
              </span>
              {festivals > 0 && (
                <span>
                  <b style={{ color: "#F5A623" }}>{festivals}</b> festival
                  {festivals > 1 ? "s" : ""}
                </span>
              )}
              {yearsActive > 0 && (
                <span>
                  <b style={{ color: "#F5A623" }}>{yearsActive}</b> year
                  {yearsActive > 1 ? "s" : ""} going
                </span>
              )}
              {topArtist && (
                <span>
                  Most-seen: <b style={{ color: "#F5A623" }}>{topArtist[0]}</b>
                  {topArtist[1] > 1 ? " ×" + topArtist[1] : ""}
                </span>
              )}
              {topCity && topCity[1] > 1 && (
                <span>
                  Home base: <b style={{ color: "#F5A623" }}>{topCity[0]}</b>
                </span>
              )}
            </div>

            {nextShow && (
              <div style={{ ...card, marginTop: 14 }}>
                <div style={{ ...sub, margin: 0 }}>Next up</div>
                <div
                  style={{
                    fontFamily: "'Bebas Neue',sans-serif",
                    fontSize: 24,
                    color: "#F0EDE8",
                    letterSpacing: 0.5,
                    cursor: "pointer",
                  }}
                  onClick={() => onArtistClick && onArtistClick(nextShow.artist)}
                >
                  {nextShow.artist}
                </div>
                <div
                  style={{
                    fontFamily: "'DM Mono',monospace",
                    fontSize: 12,
                    color: "#F5A623",
                  }}
                >
                  {daysUntil(nextShow.date) === 0
                    ? "Tonight"
                    : "In " + daysUntil(nextShow.date) + " days"}{" "}
                  · {nextShow.venue || nextShow.city || fmt(nextShow.date)}
                </div>
              </div>
            )}

            {/* TOP GENRES */}
            {topGenres.length > 0 && (
              <>
                <div style={sub}>Top genres</div>
                <div>
                  {topGenres.map(([g, n]) => (
                    <span
                      key={g}
                      style={{
                        ...chip,
                        background: "rgba(245,166,35,.12)",
                        border: "1px solid rgba(245,166,35,.3)",
                        color: "#F5A623",
                      }}
                      onClick={() => onGenreClick && onGenreClick(g)}
                      title={"Explore " + g}
                    >
                      {g} · {n}
                    </span>
                  ))}
                </div>
              </>
            )}

            {/* GENRE PASSPORT */}
            {passport.length > 0 && (
              <>
                <div style={sub}>
                  Genre passport ·{" "}
                  <span style={{ color: "#F5A623" }}>
                    {seenGenres.size} heard live
                  </span>
                </div>
                <div style={card}>
                  {passport.slice(0, 8).map(({ fam, hit }) => (
                    <div
                      key={fam}
                      onClick={() => onGenreClick && onGenreClick(fam)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "4px 0",
                        cursor: "pointer",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'DM Mono',monospace",
                          fontSize: 11,
                          color: "#ccc",
                          width: 120,
                          flexShrink: 0,
                        }}
                      >
                        {fam}
                      </span>
                      <span
                        style={{
                          flex: 1,
                          height: 6,
                          background: "#1e1e1e",
                          borderRadius: 3,
                          overflow: "hidden",
                        }}
                      >
                        <span
                          style={{
                            display: "block",
                            height: "100%",
                            width: Math.round((hit / maxFam) * 100) + "%",
                            background: "#F5A623",
                          }}
                        />
                      </span>
                      <span
                        style={{
                          fontFamily: "'DM Mono',monospace",
                          fontSize: 11,
                          color: "#777",
                          width: 22,
                          textAlign: "right",
                        }}
                      >
                        {hit}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* BUCKET LIST */}
            {bucket.length > 0 && (
              <>
                <div style={sub}>
                  🎯 Bucket list ·{" "}
                  <span style={{ color: "#F5A623" }}>
                    {bucketSeen} of {bucket.length} seen
                  </span>
                </div>
                <div style={card}>
                  {bucket.map((b) => (
                    <div
                      key={b.name}
                      onClick={() => onArtistClick && onArtistClick(b.name)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "5px 0",
                        cursor: "pointer",
                        fontFamily: "'Syne',sans-serif",
                        fontSize: 14,
                        color: b.seen ? "#F0EDE8" : "#999",
                      }}
                    >
                      <span style={{ color: b.seen ? "#5cc46a" : "#444" }}>
                        {b.seen ? "✓" : "○"}
                      </span>
                      <span
                        style={{
                          textDecoration: b.seen ? "none" : "none",
                          flex: 1,
                        }}
                      >
                        {b.name}
                      </span>
                      {b.seen && (
                        <span
                          style={{
                            fontFamily: "'DM Mono',monospace",
                            fontSize: 10,
                            color: "#5cc46a",
                          }}
                        >
                          SEEN
                        </span>
                      )}
                      {b.inbound && (
                        <span
                          style={{
                            fontFamily: "'DM Mono',monospace",
                            fontSize: 10,
                            color: "#F5A623",
                          }}
                        >
                          🎟 UPCOMING
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* FRIEND OVERLAP */}
            {friends.length > 0 && (
              <>
                <div style={sub}>Paths crossed</div>
                <div style={card}>
                  {friends.map(({ u, line }) => (
                    <div
                      key={u.id}
                      onClick={() => onViewProfile && onViewProfile(u.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "6px 0",
                        cursor: "pointer",
                      }}
                    >
                      <span
                        className="my-avatar"
                        style={{
                          background: u.color || "#F5A623",
                          width: 30,
                          height: 30,
                          fontSize: 11,
                          flexShrink: 0,
                        }}
                      >
                        {(u.name || "U").slice(0, 2).toUpperCase()}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontFamily: "'Syne',sans-serif",
                            fontSize: 14,
                            color: "#F0EDE8",
                          }}
                        >
                          {u.name}
                        </div>
                        <div
                          style={{
                            fontFamily: "'DM Mono',monospace",
                            fontSize: 11,
                            color: "#888",
                          }}
                        >
                          {line}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* SHARE */}
            <button
              onClick={onShare}
              style={{
                marginTop: 22,
                width: "100%",
                padding: "12px",
                background: "#F5A623",
                color: "#000",
                border: "none",
                borderRadius: 8,
                fontFamily: "'DM Mono',monospace",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              {copied ? "Copied to clipboard ✓" : "Share your tour"}
            </button>
            {firstShow && (
              <div
                style={{
                  textAlign: "center",
                  marginTop: 10,
                  fontFamily: "'DM Mono',monospace",
                  fontSize: 10,
                  color: "#555",
                }}
              >
                On tour since {fmt(firstShow.date)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── GENRE PAGE ────────────────────────────────────────────────────────────────
function GenrePage({
  genre,
  users,
  curUser,
  concerts,
  onBack,
  onFollowToggle,
  onViewProfile,
  onArtistClick,
  onGenreClick,
}) {
  // Family matching: this genre + its subgenres + its parent.
  const people = users.filter((u) => genreHit(u.genres, genre));
  const shows = concerts.filter((c) => genreHit(c.genres, genre));
  const parent = GENRE_PARENT_OF[genre];
  const subgenres = GENRE_TAXONOMY[genre] || [];
  // Chip row: a parent genre shows its subgenres; a subgenre shows its
  // siblings (the parent's subgenres) so genre navigation never vanishes.
  const navChips =
    subgenres.length > 0
      ? subgenres
      : parent
        ? GENRE_TAXONOMY[parent] || []
        : [];
  // Artists ranked by presence in the app: shows (weighted by attendance)
  // beat favorites, favorites beat bucket-list wishes.
  const artistScore = {};
  const bump = (a, n) => {
    if (a) artistScore[a] = (artistScore[a] || 0) + n;
  };
  users.forEach((u) => {
    if (genreHit(u.genres, genre)) {
      (u.artists || []).forEach((a) => bump(a, 2));
      (u.bucketList || []).forEach((a) => bump(a, 1));
    }
  });
  shows.forEach((c) => bump(c.artist, 3 + (c.attendees || []).length));
  const relatedArtists = Object.keys(artistScore).sort(
    (a, b) => artistScore[b] - artistScore[a],
  );
  const upcomingShows = shows
    .filter((c) => daysUntil(c.date) >= 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="genre-page">
      <div className="genre-hdr">
        <button className="back-btn" onClick={onBack}>
          ←
        </button>
        <span className="genre-hdr-name">{genre.toUpperCase()}</span>
        {parent && onGenreClick && (
          <button
            className="uc-genre"
            style={{ marginLeft: 10 }}
            onClick={() => onGenreClick(parent)}
          >
            part of {parent} ↗
          </button>
        )}
      </div>
      <div className="genre-content">
        {/* Subgenre navigation for parent genres */}
        {navChips.length > 0 && onGenreClick && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 5,
              marginBottom: 18,
            }}
          >
            {navChips.map((s) => (
              <button
                key={s}
                className="uc-genre"
                onClick={() => s !== genre && onGenreClick(s)}
                style={
                  s === genre
                    ? {
                        background: "rgba(245,166,35,.12)",
                        borderColor: "rgba(245,166,35,.4)",
                        color: "#F5A623",
                      }
                    : undefined
                }
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {/* Artists for this genre */}
        {relatedArtists.length > 0 && (
          <div className="genre-sec">
            <div className="genre-sec-hdr">Artists</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {relatedArtists.map((a) => (
                <button
                  key={a}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "6px 13px",
                    borderRadius: 14,
                    background: "#111",
                    border: "1px solid #222",
                    color: "#F0EDE8",
                    fontFamily: "'Syne',sans-serif",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all .15s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = "#888";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = "#222";
                  }}
                  onClick={() => onArtistClick(a)}
                >
                  ♪ {a}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming shows for this genre */}
        <div className="genre-sec">
          <div className="genre-sec-hdr">Upcoming Shows</div>
          {upcomingShows.length === 0 ? (
            <div className="empty" style={{ padding: "30px 0" }}>
              <div className="empty-i" style={{ fontSize: 24 }}>
                🎵
              </div>
              <div className="empty-s">
                No shows tagged with this genre yet.
              </div>
            </div>
          ) : (
            <div className="grid">
              {upcomingShows.map((c) => {
                const d = fmt(c.date),
                  u = getUrgency(c.date),
                  dy = daysUntil(c.date);
                const cc =
                  u === "urgent"
                    ? "card-u"
                    : u === "soon"
                      ? "card-s"
                      : "card-n";
                return (
                  <div
                    key={c.id}
                    className={"card " + cc}
                    onClick={() => onArtistClick(c.artist)}
                  >
                    <div
                      className="cbar"
                      style={{
                        background:
                          u === "urgent"
                            ? "#FF5050"
                            : u === "soon"
                              ? "#F5A623"
                              : "#2a2a2a",
                      }}
                    />
                    <div className="cbody">
                      {u === "urgent" && (
                        <div className="upill pill-u">
                          <div
                            className="pdot"
                            style={{ background: "#FF5050" }}
                          />
                          {dy === 0
                            ? "tonight"
                            : dy === 1
                              ? "tomorrow"
                              : dy + " days left"}
                        </div>
                      )}
                      {u === "soon" && (
                        <div className="upill pill-s">
                          <div
                            className="pdot"
                            style={{ background: "#F5A623" }}
                          />
                          {dy} days away
                        </div>
                      )}
                      <div className="drow">
                        <div className="dbdg">
                          <div className="dmo">{d.mo}</div>
                          <div className="ddy">{d.day}</div>
                          <div className="ddw">{d.dow}</div>
                        </div>
                        <div className="dart">{c.artist}</div>
                      </div>
                      <div className="dven">{c.venue}</div>
                      <div className="dcit">{c.city}</div>
                    </div>
                    <div className="cfoot">
                      <span
                        style={{
                          fontSize: 9,
                          fontFamily: "'DM Mono',monospace",
                          color: "#555",
                        }}
                      >
                        tap to see artist
                      </span>
                      {primaryUrl(c) && (
                        <a
                          href={primaryUrl(c)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            fontSize: 8,
                            fontFamily: "'DM Mono',monospace",
                            color: "#F5A623",
                            textDecoration: "none",
                          }}
                        >
                          tickets ↗
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* People into this genre */}
        <div className="genre-sec">
          <div className="genre-sec-hdr">People into {genre}</div>
          <div
            style={{
              fontFamily: "'DM Mono',monospace",
              fontSize: 10,
              color: "#555",
              margin: "-6px 0 12px",
            }}
          >
            Shows people who are Open to Connect, plus your friends.
          </div>
          {people.length === 0 ? (
            <div className="empty" style={{ padding: "20px 0" }}>
              <div className="empty-s">
                No one in the app lists this genre yet.
              </div>
            </div>
          ) : (
            [...people]
              .sort(
                (a, b) =>
                  matchInfo(curUser, b, concerts).score -
                  matchInfo(curUser, a, concerts).score,
              )
              .map((u2) => {
              const isF = curUser.following.includes(u2.id);
              const mi = matchInfo(curUser, u2, concerts);
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
                          style={{
                            background:
                              g === genre ? "rgba(245,166,35,.1)" : "",
                            borderColor:
                              g === genre ? "rgba(245,166,35,.3)" : "",
                            color: g === genre ? "#F5A623" : "",
                          }}
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                    {mi.line && (
                      <div className="uc-mutual">{mi.line}</div>
                    )}
                  </div>
                  {u2.id !== curUser.id && (
                    <button
                      className={"uc-follow " + (isF ? "ucf-y" : "ucf-n")}
                      onClick={(e) => {
                        e.stopPropagation();
                        onFollowToggle(u2.id);
                      }}
                    >
                      {isF ? "Following" : "Follow"}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ── TAG SEARCH WIDGET (used for genres, artists, bucket list) ────────────────