// js/app/08b-admin.js
//
// AdminPage — the ⚙ dashboard, gated to profile.is_admin. Split out of
// 08-onboard.js. Loads after 08-onboard.js and before 09-main.js; uses globals
// from earlier modules (supabase, timeAgo, GENRE_*, etc.) + React hooks.

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
