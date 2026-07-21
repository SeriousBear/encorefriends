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
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            display: "flex",
            gap: 5,
            zIndex: 2,
          }}
        >
          {c.hidden && c.owner_id === curUser.id && (
            <div
              title="Going quietly — only you can see this show"
              style={{
                padding: "2px 7px",
                background: "rgba(255,255,255,.05)",
                border: "1px solid #2a2a2a",
                borderRadius: 3,
                fontSize: 9,
                lineHeight: 1.4,
              }}
            >
              🤫
            </div>
          )}
          {isNew && (
            <div
              style={{
                padding: "2px 7px",
                background: "rgba(245,166,35,.15)",
                border: "1px solid rgba(245,166,35,.4)",
                borderRadius: 3,
                fontFamily: "'DM Mono',monospace",
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: 1,
                color: "#F5A623",
                textTransform: "uppercase",
              }}
            >
              NEW
            </div>
          )}
          {c.is_festival && (
            <div
              style={{
                padding: "2px 7px",
                background: "rgba(155,107,245,.12)",
                border: "1px solid rgba(155,107,245,.35)",
                borderRadius: 3,
                fontFamily: "'DM Mono',monospace",
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: 1,
                color: "#9B6BF5",
                textTransform: "uppercase",
              }}
            >
              FEST
            </div>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(c.id);
              }}
              style={{
                padding: "2px 7px",
                background: "transparent",
                border: "1px solid #2a2a2a",
                borderRadius: 3,
                fontFamily: "'DM Mono',monospace",
                fontSize: 9,
                color: "#444",
                cursor: "pointer",
                lineHeight: 1,
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
            <div className="pdot" style={{ background: "#F5A623" }} />
            {dy} days away
          </div>
        )}
        {u === "past" && (
          <div
            className="upill"
            style={{
              background: "rgba(255,255,255,0.05)",
              color: "#888",
              border: "1px solid #2a2a2a",
            }}
          >
            <div className="pdot" style={{ background: "#666" }} />
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
        <div className="sheet-bar" style={{ background: "#F5A623" }} />
        <div style={{ padding: "10px 18px 22px" }}>
          <div
            style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: 22,
              letterSpacing: 1,
              marginBottom: 2,
            }}
          >
            Share {c.artist}
          </div>
          <div
            style={{
              fontFamily: "'DM Mono',monospace",
              fontSize: 10,
              color: "#666",
              marginBottom: 12,
            }}
          >
            Sends the show as a message.
          </div>
          {friends.length === 0 ? (
            <div
              style={{
                color: "#666",
                fontFamily: "'Syne',sans-serif",
                fontSize: 13,
                padding: "18px 0",
                textAlign: "center",
              }}
            >
              Follow some people first — then you can share shows with them.
            </div>
          ) : (
            friends.map((u2) => (
              <div
                key={u2.id}
                onClick={() => onSend(u2.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 6px",
                  borderBottom: "1px solid #141414",
                  cursor: "pointer",
                  borderRadius: 6,
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "rgba(245,166,35,.05)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "";
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    background: u2.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#000",
                  }}
                >
                  {u2.name.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 14 }}>
                  {u2.name}
                </div>
                <div
                  style={{
                    marginLeft: "auto",
                    fontFamily: "'DM Mono',monospace",
                    fontSize: 10,
                    color: "#F5A623",
                  }}
                >
                  Send ▸
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── INBOX (Messages + Activity tabs) ─────────────────────────────────────────