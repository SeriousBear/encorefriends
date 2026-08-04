// A concert rendered as a torn ticket stub: gold date panel (brand constant),
// ★ marquee artist ★, venue, who-else-is-going avatars, and a countdown stub
// whose color escalates as the show nears (grey → gold → red), with a pulsing
// "tonight" peak. Tap opens the detail sheet (where going/hide/genre live).
function CCard({
  c,
  users,
  curUser,
  onOpen,
  onViewProfile,
  selecting,
  selected,
  onSelect,
}) {
  const d = fmt(c.date);
  const dy = daysUntil(c.date);
  const isMultiDay = c.is_festival && c.end_date && c.end_date !== c.date;
  const isOwner = c.owner_id === curUser.id;

  // Recently scanned within the last 24 hours?
  const isNew =
    c.scanned_at &&
    Date.now() - new Date(c.scanned_at).getTime() < 24 * 60 * 60 * 1000;

  // Countdown label + urgency tier for the stub.
  const isTonight = dy === 0;
  let cdLabel, cdClass;
  if (dy < 0) {
    cdLabel = agoLabel(dy);
    cdClass = "later";
  } else if (dy === 0) {
    cdLabel = "Tonight";
    cdClass = "live";
  } else if (dy === 1) {
    cdLabel = "Tomorrow";
    cdClass = "now";
  } else if (dy <= 7) {
    cdLabel = dy + " Days";
    cdClass = "now";
  } else if (dy <= 30) {
    cdLabel = dy + " Days";
    cdClass = "soon";
  } else {
    cdLabel = dy + " Days";
    cdClass = "later";
  }

  // "Via Ticketmaster" — only for a real ticket source (implies purchase).
  const src =
    c.source && !["Email", "Manual", "manual", ""].includes(c.source)
      ? "Via " + c.source
      : "";

  // Other people going (exclude yourself), resolved to user records.
  const others = (c.attendees || [])
    .filter((id) => id !== curUser.id)
    .map((id) => users.find((u) => u.id === id))
    .filter(Boolean);

  return (
    <div
      className={
        "tk" + (isTonight ? " live" : "") + (selected ? " tk-sel" : "")
      }
      onClick={() => (selecting ? onSelect(c.id) : onOpen(c))}
    >
      {selecting && (
        <div className={"tk-check" + (selected ? " on" : "")}>
          {selected ? "✓" : ""}
        </div>
      )}
      <div className="tk-date">
        {c.hidden && isOwner && (
          <span className="tk-quiet" title="Going quietly — only you can see this">
            🤫
          </span>
        )}
        <div className="mo">{d.mo}</div>
        <div className="dy">{d.day}</div>
        <div className="dw">{isMultiDay ? "→ " + fmt(c.end_date).day : d.dow}</div>
      </div>

      <div className="tk-tear"></div>

      <div className="tk-body">
        {isTonight ? (
          <div className="tk-src live">
            <span className="tk-livedot"></span> Tonight
          </div>
        ) : src || isNew ? (
          <div className="tk-src">
            {src}
            {src && isNew ? " · " : ""}
            {isNew && <span className="new">New</span>}
          </div>
        ) : null}
        <div className="tk-artist">
          <span className="sym">★</span>
          <span className="tk-artist-name">{c.artist}</span>
          <span className="sym">★</span>
        </div>
        <div className="tk-venue">
          {c.venue}
          {c.venue && c.city ? " · " : ""}
          {c.city}
        </div>
        {others.length > 0 && (
          <div className="tk-friends">
            {others.slice(0, 4).map((u2) => (
              <span
                key={u2.id}
                className="tkav"
                style={{ background: u2.color }}
                title={"View " + u2.name + "'s profile"}
                onClick={(e) => {
                  if (selecting) return; // let the tap select the card
                  e.stopPropagation();
                  onViewProfile && onViewProfile(u2.id);
                }}
              >
                {u2.name.slice(0, 2).toUpperCase()}
              </span>
            ))}
            {others.length > 4 && (
              <span className="tkmore">+{others.length - 4}</span>
            )}
          </div>
        )}
      </div>

      <div className="tk-tear"></div>

      <div className="tk-stub">
        <div className={"tk-cd " + cdClass}>{cdLabel}</div>
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