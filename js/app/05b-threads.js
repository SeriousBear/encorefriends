// js/app/05b-threads.js
//
// Crew/thread + concert-detail sheets split out of 05-inbox.js: CrewCreate
// (turn a show into a private group) and CDetail (the concert detail sheet).
// Both are rendered by App in 09-main.js at call time, so this loads after
// 05-inbox.js and before 09-main.js. Uses globals from earlier modules + hooks.

// ── CREATE A GROUP (name + pick followers to invite) ─────────────────────────
function CrewCreate({ show, curUser, users, onClose, onCreate }) {
  const defaultName = show.artist ? show.artist + " crew" : "New group";
  const [name, setName] = useState(defaultName);
  const [picked, setPicked] = useState([]);
  const [saving, setSaving] = useState(false);
  const follows = users.filter(
    (u) => u.id !== curUser.id && (curUser.following || []).includes(u.id),
  );
  const toggle = (id) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const create = async () => {
    if (saving) return;
    setSaving(true);
    await onCreate(show, name, picked);
  };
  return (
    <div className="mwrap" onClick={onClose} style={{ zIndex: 700 }}>
      <div
        className="sheet"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 440 }}
      >
        <div className="sheet-bar" style={{ background: "var(--gold)" }} />
        <div style={{ padding: "10px 18px 22px" }}>
          <div
            style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: 22,
              letterSpacing: 1,
              marginBottom: 10,
            }}
          >
            New group chat
          </div>
          <div
            style={{
              fontFamily: "'DM Mono',monospace",
              fontSize: 10,
              letterSpacing: 2,
              color: "var(--gold)",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Name
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={defaultName}
            style={{
              width: "100%",
              background: "var(--panel)",
              border: "1px solid var(--line)",
              borderRadius: 6,
              color: "var(--fg)",
              fontFamily: "'Inter','Syne',sans-serif",
              fontSize: 14,
              padding: "10px 12px",
              outline: "none",
              boxSizing: "border-box",
              marginBottom: 16,
            }}
          />
          <div
            style={{
              fontFamily: "'DM Mono',monospace",
              fontSize: 10,
              letterSpacing: 2,
              color: "var(--gold)",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Add people you follow{picked.length ? " (" + picked.length + ")" : ""}
          </div>
          {follows.length === 0 ? (
            <div
              style={{
                fontFamily: "'DM Mono',monospace",
                fontSize: 10,
                color: "var(--fg3)",
                padding: "8px 0 14px",
              }}
            >
              Follow some people first — then you can add them to a group.
            </div>
          ) : (
            <div style={{ maxHeight: "38vh", overflowY: "auto", marginBottom: 14 }}>
              {follows.map((u2) => {
                const on = picked.includes(u2.id);
                return (
                  <div
                    key={u2.id}
                    onClick={() => toggle(u2.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 4px",
                      borderBottom: "1px solid var(--card-2)",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: u2.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 9,
                        fontWeight: 700,
                        color: "#000",
                        flexShrink: 0,
                      }}
                    >
                      {u2.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span
                      style={{
                        flex: 1,
                        fontFamily: "'Inter','Syne',sans-serif",
                        fontSize: 13,
                      }}
                    >
                      {u2.name}
                    </span>
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 5,
                        border:
                          "1px solid " + (on ? "var(--gold)" : "var(--line-2)"),
                        background: on ? "var(--gold)" : "transparent",
                        color: "#000",
                        fontSize: 12,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {on ? "✓" : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <button
            onClick={create}
            disabled={saving}
            style={{
              width: "100%",
              padding: "11px 0",
              background: "var(--gold)",
              border: "none",
              borderRadius: 6,
              color: "#000",
              fontFamily: "'DM Mono',monospace",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1,
              cursor: saving ? "default" : "pointer",
            }}
          >
            {saving
              ? "Creating…"
              : picked.length
                ? "Create & invite " + picked.length
                : "Create group"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── CONCERT DETAIL SHEET ──────────────────────────────────────────────────────
function CDetail({
  c,
  users,
  curUser,
  onClose,
  onToggleAttendee,
  onViewProfile,
  onGenreClick,
  onShare,
  onToggleHidden,
  myGroups,
  onStartGroup,
  onOpenCrew,
}) {
  const u = getUrgency(c.date),
    dy = daysUntil(c.date),
    d = fmt(c.date);
  const dt =
    dy < 0
      ? agoLabel(dy)
      : dy === 0
        ? "Tonight!"
        : dy === 1
          ? "Tomorrow!"
          : dy + " days away";
  const bc = u === "urgent" ? "bdg-u" : u === "soon" ? "bdg-s" : "bdg-n",
    rc = u === "urgent" ? "#FF5555" : "var(--gold)";
  const showR = u === "urgent" || u === "soon";
  const isFestival = c.is_festival && c.end_date && c.end_date !== c.date;
  const crewBtn = {
    margin: "8px 0 2px",
    width: "100%",
    padding: "10px 0",
    background: "rgba(245,166,35,.06)",
    border: "1px solid rgba(245,166,35,.3)",
    borderRadius: 6,
    color: "var(--gold)",
    fontFamily: "'DM Mono',monospace",
    fontSize: 11,
    letterSpacing: 1,
    cursor: "pointer",
  };
  const tasteGoing = (c.attendees || []).filter((uid) => {
    if (uid === curUser.id) return false;
    const u2 = users.find((x) => x.id === uid);
    return (
      u2 && (u2.genres || []).some((g) => (curUser.genres || []).includes(g))
    );
  }).length;
  const dateStr = isFestival
    ? fmt(c.date).full + " – " + fmt(c.end_date).full
    : d.dow + ", " + d.full;
  return (
    <div className="mwrap" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-bar" style={{ background: uColor(u) }} />
        <div className="sheet-handle" />
        <div className="sheet-body">
          <div className="sh-artist">{c.artist}</div>
          <div className="sh-venue">{c.venue}</div>
          <div className="sh-date">
            {c.city} · {dateStr}
          </div>
          {(c.genres || []).length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 5,
                marginTop: 8,
              }}
            >
              {(c.genres || []).map((g) => (
                <span
                  key={g}
                  className="genre-tag"
                  onClick={() => onGenreClick && onGenreClick(g)}
                >
                  {g}
                </span>
              ))}
            </div>
          )}
          <div className={"sh-daybdg " + bc}>
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background:
                  u === "urgent"
                    ? "#FF5555"
                    : u === "soon"
                      ? "var(--gold)"
                      : "#444",
                display: "inline-block",
              }}
            />
            {dt}
          </div>
          {tasteGoing > 0 && (
            <div
              style={{
                fontFamily: "'DM Mono',monospace",
                fontSize: 11,
                color: "var(--gold)",
                margin: "10px 0 2px",
              }}
            >
              ⚡ {tasteGoing} {tasteGoing === 1 ? "person" : "people"} with
              your taste {tasteGoing === 1 ? "is" : "are"} going
            </div>
          )}
          {onShare && (
            <button
              onClick={() => onShare(c)}
              style={{
                margin: "10px 0 2px",
                width: "100%",
                padding: "10px 0",
                background: "transparent",
                border: "1px solid var(--line-2)",
                borderRadius: 6,
                color: "var(--fg2)",
                fontFamily: "'DM Mono',monospace",
                fontSize: 11,
                letterSpacing: 1,
                cursor: "pointer",
              }}
            >
              ✉ SHARE WITH A FRIEND
            </button>
          )}
          {c.owner_id === curUser.id && onToggleHidden && (
            <button
              onClick={() => onToggleHidden(c)}
              title="Hidden shows never appear to anyone else — not friends, not matches."
              style={{
                margin: "8px 0 2px",
                width: "100%",
                padding: "10px 0",
                background: c.hidden ? "rgba(255,255,255,.04)" : "transparent",
                border: "1px solid " + (c.hidden ? "#3a3a3a" : "var(--line-2)"),
                borderRadius: 6,
                color: c.hidden ? "#ddd" : "var(--fg3)",
                fontFamily: "'DM Mono',monospace",
                fontSize: 10,
                letterSpacing: 1,
                cursor: "pointer",
              }}
            >
              {c.hidden
                ? "🤫 GOING QUIETLY — ONLY YOU SEE THIS. TAP TO UNHIDE"
                : "👁 VISIBLE TO FRIENDS & MATCHES. TAP TO GO QUIETLY"}
            </button>
          )}
          {curUser.id && onStartGroup && (
            <>
              {(myGroups || []).map((g) => (
                <button
                  key={g.id}
                  onClick={() => onOpenCrew(g.id)}
                  style={crewBtn}
                >
                  💬 OPEN{" "}
                  {g.name ||
                    (g.show_artist ? g.show_artist + " crew" : "group")}
                </button>
              ))}
              <button onClick={() => onStartGroup(c)} style={crewBtn}>
                👥 START A GROUP CHAT FOR THIS SHOW
              </button>
            </>
          )}
          <div className="sh-lbl nb">Get Tickets</div>
          {primaryUrl(c) ? (
            <a
              className="sh-buy"
              href={primaryUrl(c)}
              target="_blank"
              rel="noreferrer"
            >
              <span>
                {vendorLabel(c) ? "Buy on " + vendorLabel(c) : "Get Tickets"}
              </span>
              <span className="sh-buy-src">Official ↗</span>
            </a>
          ) : (
            <div className="sh-buy sh-buy-nolink">
              <span>
                {vendorLabel(c) ? "Via " + vendorLabel(c) : "Ticket link unavailable"}
              </span>
              <span className="sh-buy-src">no direct link</span>
            </div>
          )}
          {showR && (
            <>
              <div className="rsh" style={{ color: rc }}>
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: rc,
                    display: "inline-block",
                  }}
                />
                {u === "urgent"
                  ? "Last-minute resale"
                  : "Coming up — find extras here"}
              </div>
              <div className="rsg">
                {RESELLERS.map((r) => (
                  <a
                    key={r.name}
                    className="rsl"
                    href={r.url(c.artist)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <div className="rsd" style={{ background: r.color }} />
                      <div>
                        <div className="rsn">{r.name}</div>
                        <div className="rst">{r.tag}</div>
                      </div>
                    </div>
                    <div className="rsa">↗</div>
                  </a>
                ))}
              </div>
            </>
          )}
          <div className="sh-lbl">Listen to {c.artist}</div>
          <div className="sg">
            {STREAMS.map((s) => (
              <a
                key={s.name}
                className="sl"
                href={s.url(c.artist)}
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
          <div className="sh-lbl">Who's Going</div>
          {users.map((u2) => {
            const sel = (c.attendees || []).includes(u2.id);
            const isMe = u2.id === curUser.id;
            return (
              <div
                key={u2.id}
                className={"who-row" + (sel ? " who-sel" : "")}
                onClick={() => onToggleAttendee(c.id, u2.id)}
              >
                <div
                  className="who-av"
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: u2.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 8,
                    fontWeight: 700,
                    color: "#000",
                  }}
                  title={"View " + u2.name + "'s profile"}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                    onViewProfile && onViewProfile(u2.id);
                  }}
                >
                  {u2.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="who-name">
                  {isMe ? "Me (" + u2.name + ")" : u2.name}
                </span>
                {u2.notify && !isMe && (
                  <span
                    style={{
                      fontSize: 8,
                      fontFamily: "'DM Mono',monospace",
                      color: "var(--gold)",
                    }}
                  >
                    NOTIF
                  </span>
                )}
                <div className={"mck" + (sel ? " mck-on" : "")}>
                  {sel ? "✓" : ""}
                </div>
              </div>
            );
          })}
          <button className="sh-close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

