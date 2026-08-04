function CCard({
  c,
  users,
  curUser,
  onOpen,
  onToggleGoing,
  onViewProfile,
  onDelete,
  onGenreClick,
}) {
  const d = fmt(c.date),
    u = getUrgency(c.date),
    dy = daysUntil(c.date);
  const cc = u === "urgent" ? "card-u" : u === "soon" ? "card-s" : "card-n";
  const going = c.attendees?.includes(curUser.id);

  // Recently scanned within the last 24 hours?
  const isNew =
    c.scanned_at &&
    Date.now() - new Date(c.scanned_at).getTime() < 24 * 60 * 60 * 1000;

  // Multi-day festival
  const isMultiDay = c.is_festival && c.end_date && c.end_date !== c.date;
  const dateDisplay = isMultiDay
    ? fmt(c.date).mo + " " + fmt(c.date).day + "–" + fmt(c.end_date).day
    : null;

  return (
    <div className={"card " + cc} onClick={() => onOpen(c)}>
      <div className="cbar" style={{ background: uColor(u) }} />
      <div className="cbody">
        <div className="card-badges">
          {c.hidden && c.owner_id === curUser.id && (
            <div
              className="card-badge quiet"
              title="Going quietly — only you can see this show"
            >
              🤫
            </div>
          )}
          {isNew && <div className="card-badge new">NEW</div>}
          {c.is_festival && <div className="card-badge fest">FEST</div>}
          {onDelete && (
            <button
              className="card-badge del"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(c.id);
              }}
              title="Remove this show"
            >
              ×
            </button>
          )}
        </div>
        {u === "urgent" && (
          <div className="upill pill-u">
            <div className="pdot" style={{ background: "#FF5050" }} />
            {dy === 0 ? "tonight" : dy === 1 ? "tomorrow" : dy + " days left"}
          </div>
        )}
        {u === "soon" && (
          <div className="upill pill-s">
            <div className="pdot" style={{ background: "var(--gold)" }} />
            {dy} days away
          </div>
        )}
        {u === "past" && (
          <div
            className="upill"
            style={{
              background: "rgba(255,255,255,0.05)",
              color: "var(--fg2)",
              border: "1px solid var(--line-2)",
            }}
          >
            <div className="pdot" style={{ background: "var(--fg3)" }} />
            {agoLabel(dy)}
          </div>
        )}
        <div className="drow">
          <div className="dbdg">
            <div className="dmo">{d.mo}</div>
            <div className="ddy">{d.day}</div>
            <div className="ddw">
              {isMultiDay ? "→ " + fmt(c.end_date).day : d.dow}
            </div>
          </div>
          <div className="dart">{c.artist}</div>
        </div>
        <div className="dven">{c.venue}</div>
        <div className="dcit">{c.city}</div>
        {(c.genres || []).length > 0 && (
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 7 }}
          >
            {(c.genres || []).slice(0, 3).map((g) => (
              <span
                key={g}
                className="uc-genre"
                title={"Explore " + g}
                onClick={(e) => {
                  e.stopPropagation();
                  onGenreClick && onGenreClick(g);
                }}
              >
                {g}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="cfoot" onClick={(e) => e.stopPropagation()}>
        <div className="ftags">
          {(c.attendees || []).slice(0, 5).map((uid) => {
            const u2 = users.find((u) => u.id === uid);
            return u2 ? (
              <div
                key={uid}
                className="ftag"
                style={{ background: u2.color }}
                title={"View " + u2.name + "'s profile"}
                onClick={(e) => {
                  e.stopPropagation();
                  onViewProfile && onViewProfile(uid);
                }}
              >
                {u2.name.slice(0, 2).toUpperCase()}
              </div>
            ) : null;
          })}
          <button className="tagbtn" onClick={() => onOpen(c)}>
            + tag
          </button>
        </div>
        <div
          className={"tkbdg " + (going ? "tk-on" : "tk-off")}
          onClick={() => onToggleGoing(c.id)}
        >
          {going ? "✓ going" : "not going"}
        </div>
      </div>
    </div>
  );
}

// ── SHARE PICKER (send a show to a friend as a message) ──────────────────────
function SharePicker({ c, users, curUser, onClose, onSend }) {
  const friends = users.filter(
    (u) =>
      u.id !== curUser.id &&
      ((curUser.following || []).includes(u.id) ||
        (u.following || []).includes(curUser.id)),
  );
  return (
    <div className="mwrap" onClick={onClose} style={{ zIndex: 700 }}>
      <div
        className="sheet"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 420 }}
      >
        <div className="sheet-bar" style={{ background: "var(--gold)" }} />
        <div style={{ padding: "10px 18px 22px" }}>
          <div className="share-title">Share {c.artist}</div>
          <div className="share-meta">Sends the show as a message.</div>
          {friends.length === 0 ? (
            <div className="share-empty">
              Follow some people first — then you can share shows with them.
            </div>
          ) : (
            friends.map((u2) => (
              <div
                key={u2.id}
                className="share-row"
                onClick={() => onSend(u2.id)}
              >
                <div className="share-av" style={{ background: u2.color }}>
                  {u2.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="share-name">{u2.name}</div>
                <div className="share-send">Send ▸</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── INBOX (Messages + Activity tabs) ─────────────────────────────────────────