// js/app/06b-tour.js
//
// "Your Tour" — the personal stats page. Split out of 06-profile.js to keep
// each module small. Loads AFTER 06-profile.js and before 09-main.js; relies on
// globals from earlier modules: matchInfo / GENRE_* (02-genres), daysUntil / fmt
// (03-helpers), and React hooks. Rendered by App in 09-main.js on view==="tour".

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
    color: "var(--fg3)",
    textTransform: "uppercase",
    margin: "22px 0 8px",
    fontFamily: "'DM Mono',monospace",
  };
  const card = {
    background: "var(--card)",
    border: "1px solid var(--line)",
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
                color: "var(--gold)",
                letterSpacing: 1,
              }}
            >
              Your tour starts here
            </div>
            <div
              style={{
                fontFamily: "'Inter','Syne',sans-serif",
                color: "var(--fg2)",
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
                fontFamily: "'Inter','Syne',sans-serif",
                fontSize: 13,
                color: "var(--fg2)",
              }}
            >
              <span>
                <b style={{ color: "var(--gold)" }}>{showsThisYear}</b> in {thisYear}
              </span>
              {festivals > 0 && (
                <span>
                  <b style={{ color: "var(--gold)" }}>{festivals}</b> festival
                  {festivals > 1 ? "s" : ""}
                </span>
              )}
              {yearsActive > 0 && (
                <span>
                  <b style={{ color: "var(--gold)" }}>{yearsActive}</b> year
                  {yearsActive > 1 ? "s" : ""} going
                </span>
              )}
              {topArtist && (
                <span>
                  Most-seen: <b style={{ color: "var(--gold)" }}>{topArtist[0]}</b>
                  {topArtist[1] > 1 ? " ×" + topArtist[1] : ""}
                </span>
              )}
              {topCity && topCity[1] > 1 && (
                <span>
                  Home base: <b style={{ color: "var(--gold)" }}>{topCity[0]}</b>
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
                    color: "var(--fg)",
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
                    color: "var(--gold)",
                  }}
                >
                  {daysUntil(nextShow.date) === 0
                    ? "Tonight"
                    : "In " + daysUntil(nextShow.date) + " days"}{" "}
                  · {nextShow.venue || nextShow.city || fmt(nextShow.date).full}
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
                        color: "var(--gold)",
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
                  <span style={{ color: "var(--gold)" }}>
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
                          color: "var(--fg2)",
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
                          background: "var(--line)",
                          borderRadius: 3,
                          overflow: "hidden",
                        }}
                      >
                        <span
                          style={{
                            display: "block",
                            height: "100%",
                            width: Math.round((hit / maxFam) * 100) + "%",
                            background: "var(--gold)",
                          }}
                        />
                      </span>
                      <span
                        style={{
                          fontFamily: "'DM Mono',monospace",
                          fontSize: 11,
                          color: "var(--fg2)",
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
                  <span style={{ color: "var(--gold)" }}>
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
                        fontFamily: "'Inter','Syne',sans-serif",
                        fontSize: 14,
                        color: b.seen ? "var(--fg)" : "#999",
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
                            color: "var(--gold)",
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
                          background: u.color || "var(--gold)",
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
                            fontFamily: "'Inter','Syne',sans-serif",
                            fontSize: 14,
                            color: "var(--fg)",
                          }}
                        >
                          {u.name}
                        </div>
                        <div
                          style={{
                            fontFamily: "'DM Mono',monospace",
                            fontSize: 11,
                            color: "var(--fg2)",
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
                background: "var(--gold)",
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
                  color: "var(--fg4)",
                }}
              >
                On tour since {fmt(firstShow.date).full}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
