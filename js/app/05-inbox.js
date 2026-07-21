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
        <div className="sheet-bar" style={{ background: "#F5A623" }} />
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
              color: "#F5A623",
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
              background: "#0c0c0c",
              border: "1px solid #1e1e1e",
              borderRadius: 6,
              color: "#f0ede8",
              fontFamily: "'Syne',sans-serif",
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
              color: "#F5A623",
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
                color: "#666",
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
                      borderBottom: "1px solid #141414",
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
                        fontFamily: "'Syne',sans-serif",
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
                          "1px solid " + (on ? "#F5A623" : "#2a2a2a"),
                        background: on ? "#F5A623" : "transparent",
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
              background: "#F5A623",
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

function InboxSheet({
  curUser,
  users,
  msgs,
  notifs,
  notifMsg,
  tab,
  setTab,
  activeThread,
  setActiveThread,
  actFilter,
  setActFilter,
  onSend,
  onClose,
  onViewProfile,
  onReportBug,
  onMarkActivityRead,
  myBlocks,
  onBlock,
  crews,
  activeCrew,
  setActiveCrew,
  onLeaveCrew,
  onCrewRead,
  onAcceptInvite,
  onDeclineInvite,
  onRenameCrew,
}) {
  const [draft, setDraft] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const [crewMsgs, setCrewMsgs] = useState([]);
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState("");
  const listRef = useRef(null);
  // Display name for a group: custom name, else "<artist> crew".
  const crewName = (t) =>
    t && (t.name || (t.show_artist ? t.show_artist + " crew" : "Group"));
  const isJoined = (t) =>
    (t.thread_members || []).some(
      (m) => m.user_id === curUser.id && m.status === "joined",
    );

  // Load + live-subscribe the open crew's messages; mark the crew read.
  useEffect(() => {
    if (!activeCrew) {
      setCrewMsgs([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("thread_messages")
        .select("*")
        .eq("thread_id", activeCrew)
        .order("created_at", { ascending: true })
        .limit(200);
      if (!cancelled && data) setCrewMsgs(data);
    })();
    onCrewRead && onCrewRead(activeCrew);
    let cch;
    if (typeof supabase.channel === "function") {
      cch = supabase
        .channel("crew-" + activeCrew)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "thread_messages",
            filter: "thread_id=eq." + activeCrew,
          },
          (payload) => {
            if (payload.new) {
              setCrewMsgs((p) =>
                p.some((m) => m.id === payload.new.id)
                  ? p
                  : [...p, payload.new],
              );
              onCrewRead && onCrewRead(activeCrew);
            }
          },
        )
        .subscribe();
    }
    return () => {
      cancelled = true;
      if (cch) supabase.removeChannel(cch);
    };
  }, [activeCrew]);

  const sendCrew = async () => {
    const t = draft.trim();
    if (!t || !activeCrew) return;
    setDraft("");
    const { data, error } = await supabase
      .from("thread_messages")
      .insert({ thread_id: activeCrew, sender_id: curUser.id, body: t })
      .select()
      .single();
    if (!error && data)
      setCrewMsgs((p) =>
        p.some((m) => m.id === data.id) ? p : [...p, data],
      );
  };
  useEffect(() => {
    if (tab === "activity") onMarkActivityRead();
  }, [tab]);
  useEffect(() => {
    if (listRef.current)
      listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [msgs.length, activeThread, crewMsgs.length, activeCrew]);

  const vMsgs = msgs.filter((m) => {
    const o = m.sender_id === curUser.id ? m.recipient_id : m.sender_id;
    return !(myBlocks || []).includes(o);
  });
  const unreadM = vMsgs.filter(
    (m) => m.recipient_id === curUser.id && !m.read,
  ).length;
  const unreadN = notifs.filter((n) => !n.read).length;

  // Threads grouped by the other participant, newest first.
  const threads = {};
  vMsgs.forEach((m) => {
    const other = m.sender_id === curUser.id ? m.recipient_id : m.sender_id;
    if (!threads[other]) threads[other] = { last: m, unread: 0 };
    else if (
      new Date(m.created_at) > new Date(threads[other].last.created_at)
    )
      threads[other].last = m;
    if (m.recipient_id === curUser.id && !m.read) threads[other].unread++;
  });
  const myCrews = (crews || []).filter(isJoined);
  const pendingInvites = (crews || []).filter((t) =>
    (t.thread_members || []).some(
      (m) => m.user_id === curUser.id && m.status === "invited",
    ),
  );
  const joinedCount = (t) =>
    (t.thread_members || []).filter((m) => m.status === "joined").length;
  const crewUnread = (t) => {
    const me = (t.thread_members || []).find(
      (m) => m.user_id === curUser.id,
    );
    return !!(
      me &&
      t.last_message_at &&
      new Date(t.last_message_at) > new Date(me.last_read_at)
    );
  };
  const crewUnreadTotal = myCrews.filter(crewUnread).length;
  const threadIds = Object.keys(threads).sort(
    (a, b) =>
      new Date(threads[b].last.created_at) -
      new Date(threads[a].last.created_at),
  );

  const isConnected = (id) => {
    const u2 = users.find((u) => u.id === id);
    return (
      (curUser.following || []).includes(id) ||
      (u2 && (u2.following || []).includes(curUser.id))
    );
  };
  // A request = a stranger wrote first and you've never replied.
  const isRequest = (id) =>
    !isConnected(id) &&
    !vMsgs.some((m) => m.sender_id === curUser.id && m.recipient_id === id);

  const threadMsgs = activeThread
    ? vMsgs
        .filter(
          (m) =>
            m.sender_id === activeThread || m.recipient_id === activeThread,
        )
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    : [];
  const other = activeThread
    ? users.find((u) => u.id === activeThread)
    : null;

  const send = async () => {
    const t = draft.trim();
    if (!t || !activeThread) return;
    setDraft("");
    await onSend(activeThread, t, null);
  };

  const filteredNotifs = notifs.filter((n) =>
    actFilter === "all"
      ? true
      : actFilter === "shows"
        ? n.type === "new_show" || n.type === "taste_match"
        : n.type !== "new_show" && n.type !== "taste_match",
  );

  const mono = {
    fontFamily: "'DM Mono',monospace",
    fontSize: 10,
    color: "#666",
  };
  const tabStyle = (on) => ({
    flex: 1,
    padding: "8px 0",
    background: "transparent",
    border: "none",
    borderBottom: "2px solid " + (on ? "#F5A623" : "transparent"),
    color: on ? "#F5A623" : "#666",
    fontFamily: "'DM Mono',monospace",
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
    cursor: "pointer",
  });
  const chip = (on) => ({
    padding: "4px 10px",
    borderRadius: 12,
    background: on ? "rgba(245,166,35,.1)" : "transparent",
    border: "1px solid " + (on ? "rgba(245,166,35,.4)" : "#222"),
    color: on ? "#F5A623" : "#666",
    fontFamily: "'DM Mono',monospace",
    fontSize: 10,
    cursor: "pointer",
  });

  return (
    <div className="mwrap" onClick={onClose}>
      <div
        className="sheet"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 460 }}
      >
        <div className="sheet-bar" style={{ background: "#F5A623" }} />
        <div style={{ padding: "10px 18px 22px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <div
              style={{
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: 24,
                color: "#fff",
                letterSpacing: 1,
              }}
            >
              Inbox
            </div>
            <button
              onClick={onReportBug}
              style={{
                background: "none",
                border: "1px solid #1e1e1e",
                color: "#888",
                fontSize: 11,
                fontFamily: "'DM Mono',monospace",
                padding: "5px 10px",
                borderRadius: 5,
                cursor: "pointer",
              }}
            >
              🐛 Report a bug
            </button>
          </div>

          <div style={{ display: "flex", marginBottom: 14 }}>
            <button
              style={tabStyle(tab === "messages")}
              onClick={() => setTab("messages")}
            >
              Messages
              {unreadM + crewUnreadTotal > 0
                ? " (" + (unreadM + crewUnreadTotal) + ")"
                : ""}
            </button>
            <button
              style={tabStyle(tab === "activity")}
              onClick={() => setTab("activity")}
            >
              Activity{unreadN > 0 ? " (" + unreadN + ")" : ""}
            </button>
          </div>

          {/* ── MESSAGES ── */}
          {tab === "messages" && !activeThread && !activeCrew && (
            <div>
              {!showCompose ? (
                <button
                  onClick={() => setShowCompose(true)}
                  style={{
                    width: "100%",
                    marginBottom: 10,
                    padding: "9px 0",
                    background: "transparent",
                    border: "1px dashed #2a2a2a",
                    borderRadius: 6,
                    color: "#888",
                    fontFamily: "'DM Mono',monospace",
                    fontSize: 11,
                    letterSpacing: 1,
                    cursor: "pointer",
                  }}
                >
                  ✎ NEW MESSAGE
                </button>
              ) : (
                <div style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'DM Mono',monospace",
                        fontSize: 10,
                        letterSpacing: 2,
                        color: "#F5A623",
                        textTransform: "uppercase",
                      }}
                    >
                      Message someone
                    </span>
                    <button
                      onClick={() => setShowCompose(false)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#666",
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  {users.filter(
                    (u) => u.id !== curUser.id && isConnected(u.id),
                  ).length === 0 ? (
                    <div
                      style={{
                        fontFamily: "'DM Mono',monospace",
                        fontSize: 10,
                        color: "#666",
                        padding: "8px 0",
                      }}
                    >
                      Follow someone (or get followed) to start a chat.
                    </div>
                  ) : (
                    users
                      .filter((u) => u.id !== curUser.id && isConnected(u.id))
                      .map((u2) => (
                        <div
                          key={u2.id}
                          onClick={() => {
                            setShowCompose(false);
                            setActiveThread(u2.id);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "8px 4px",
                            borderBottom: "1px solid #141414",
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
                            }}
                          >
                            {u2.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span
                            style={{
                              fontFamily: "'Syne',sans-serif",
                              fontSize: 13,
                            }}
                          >
                            {u2.name}
                          </span>
                        </div>
                      ))
                  )}
                </div>
              )}
              {pendingInvites.length > 0 && (
                <div style={{ margin: "2px 0 10px" }}>
                  <div
                    style={{
                      fontFamily: "'DM Mono',monospace",
                      fontSize: 9,
                      letterSpacing: 2,
                      color: "#F5A623",
                      textTransform: "uppercase",
                      marginBottom: 4,
                    }}
                  >
                    Group invites
                  </div>
                  {pendingInvites.map((t) => {
                    const inviter = users.find(
                      (u) =>
                        u.id ===
                        (t.thread_members || []).find(
                          (m) => m.user_id === curUser.id,
                        )?.invited_by,
                    );
                    return (
                      <div
                        key={t.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "9px 4px",
                          borderBottom: "1px solid #141414",
                        }}
                      >
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 8,
                            background: "rgba(245,166,35,.08)",
                            border: "1px solid rgba(245,166,35,.3)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 14,
                            flexShrink: 0,
                          }}
                        >
                          👥
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontFamily: "'Syne',sans-serif",
                              fontSize: 14,
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {crewName(t)}
                          </div>
                          <div style={mono}>
                            {inviter ? inviter.name + " invited you" : "Invite"}
                          </div>
                        </div>
                        <button
                          onClick={() => onAcceptInvite(t.id)}
                          style={{
                            background: "#F5A623",
                            border: "none",
                            color: "#000",
                            fontFamily: "'DM Mono',monospace",
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "5px 10px",
                            borderRadius: 5,
                            cursor: "pointer",
                            flexShrink: 0,
                          }}
                        >
                          Join
                        </button>
                        <button
                          onClick={() => onDeclineInvite(t.id)}
                          style={{
                            background: "none",
                            border: "1px solid #2a2a2a",
                            color: "#888",
                            fontFamily: "'DM Mono',monospace",
                            fontSize: 10,
                            padding: "5px 9px",
                            borderRadius: 5,
                            cursor: "pointer",
                            flexShrink: 0,
                          }}
                        >
                          Decline
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              {myCrews.length > 0 && (
                <div style={{ margin: "2px 0 10px" }}>
                  <div
                    style={{
                      fontFamily: "'DM Mono',monospace",
                      fontSize: 9,
                      letterSpacing: 2,
                      color: "#555",
                      textTransform: "uppercase",
                      marginBottom: 4,
                    }}
                  >
                    Crews
                  </div>
                  {myCrews.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setActiveCrew(t.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "9px 4px",
                        borderBottom: "1px solid #141414",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 8,
                          background: "#1d1d1d",
                          border: "1px solid #2a2a2a",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                          flexShrink: 0,
                        }}
                      >
                        👥
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontFamily: "'Syne',sans-serif",
                            fontSize: 14,
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {crewName(t)}
                        </div>
                        <div style={mono}>
                          {t.show_date} · {joinedCount(t)} in the group
                        </div>
                      </div>
                      {crewUnread(t) && (
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "#F5A623",
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
              {threadIds.length === 0 ? (
                <div
                  style={{
                    color: "#666",
                    fontFamily: "'Syne',sans-serif",
                    fontSize: 13,
                    padding: "24px 0",
                    textAlign: "center",
                  }}
                >
                  No messages yet — hit ✎ New message, or share a show
                  from any show page.
                </div>
              ) : (
                threadIds.map((tid) => {
                  const u2 = users.find((u) => u.id === tid);
                  const t = threads[tid];
                  const preview = t.last.show
                    ? "🎟 " + (t.last.show.artist || "a show")
                    : t.last.body;
                  return (
                    <div
                      key={tid}
                      onClick={() => setActiveThread(tid)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "11px 4px",
                        borderBottom: "1px solid #141414",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          background: u2 ? u2.color : "#333",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#000",
                          flexShrink: 0,
                        }}
                      >
                        {(u2 ? u2.name : "??").slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontFamily: "'Syne',sans-serif",
                            fontSize: 14,
                            fontWeight: t.unread ? 700 : 500,
                          }}
                        >
                          {u2 ? u2.name : "Member"}
                          {isRequest(tid) && (
                            <span
                              style={{
                                fontFamily: "'DM Mono',monospace",
                                fontSize: 9,
                                color: "#F5A623",
                                marginLeft: 6,
                                letterSpacing: 1,
                              }}
                            >
                              · REQUEST
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            ...mono,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            color: t.unread ? "#aaa" : "#555",
                          }}
                        >
                          {t.last.sender_id === curUser.id ? "You: " : ""}
                          {preview}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={mono}>{timeAgo(t.last.created_at)}</div>
                        {t.unread > 0 && (
                          <div
                            style={{
                              marginTop: 4,
                              marginLeft: "auto",
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: "#F5A623",
                            }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {tab === "messages" && activeThread && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <button
                  className="back-btn"
                  onClick={() => setActiveThread(null)}
                >
                  ←
                </button>
                <span
                  onClick={() => other && onViewProfile(other.id)}
                  style={{
                    fontFamily: "'Syne',sans-serif",
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {other ? other.name : "Member"}
                </span>
              </div>
              {isRequest(activeThread) && (
                <div
                  style={{
                    padding: "8px 10px",
                    marginBottom: 10,
                    background: "rgba(245,166,35,.05)",
                    border: "1px solid rgba(245,166,35,.2)",
                    borderRadius: 6,
                    fontFamily: "'DM Mono',monospace",
                    fontSize: 10,
                    color: "#888",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <span>
                    {(other ? other.name : "Someone") +
                      " wants to connect — reply to accept."}
                  </span>
                  <button
                    onClick={() => onBlock(activeThread)}
                    style={{
                      background: "none",
                      border: "1px solid #442222",
                      color: "#ff6b6b",
                      fontFamily: "'DM Mono',monospace",
                      fontSize: 10,
                      padding: "4px 9px",
                      borderRadius: 5,
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    Block
                  </button>
                </div>
              )}
              <div
                ref={listRef}
                style={{
                  maxHeight: "45vh",
                  overflowY: "auto",
                  padding: "4px 2px",
                }}
              >
                {threadMsgs.map((m) => {
                  const mine = m.sender_id === curUser.id;
                  return (
                    <div
                      key={m.id}
                      style={{
                        display: "flex",
                        justifyContent: mine ? "flex-end" : "flex-start",
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "78%",
                          padding: "8px 12px",
                          borderRadius: 10,
                          background: mine
                            ? "rgba(245,166,35,.12)"
                            : "#161616",
                          border:
                            "1px solid " +
                            (mine ? "rgba(245,166,35,.3)" : "#222"),
                          fontFamily: "'Syne',sans-serif",
                          fontSize: 13,
                          color: "#f0ede8",
                        }}
                      >
                        {m.show && (
                          <div
                            style={{
                              padding: "8px 10px",
                              marginBottom: m.body ? 6 : 0,
                              background: "#0c0c0c",
                              border: "1px solid #2a2a2a",
                              borderRadius: 6,
                            }}
                          >
                            <div
                              style={{
                                fontFamily: "'Bebas Neue',sans-serif",
                                fontSize: 16,
                                letterSpacing: 1,
                              }}
                            >
                              🎟 {m.show.artist}
                            </div>
                            <div style={mono}>
                              {m.show.venue}
                              {m.show.city ? " · " + m.show.city : ""}
                              {m.show.date ? " · " + m.show.date : ""}
                            </div>
                          </div>
                        )}
                        {m.body}
                        <div
                          style={{
                            ...mono,
                            fontSize: 8,
                            marginTop: 4,
                            textAlign: mine ? "right" : "left",
                          }}
                        >
                          {timeAgo(m.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") send();
                  }}
                  placeholder={
                    "Message " + (other ? other.name : "") + "…"
                  }
                  style={{
                    flex: 1,
                    background: "#0c0c0c",
                    border: "1px solid #1e1e1e",
                    borderRadius: 6,
                    color: "#f0ede8",
                    fontFamily: "'Syne',sans-serif",
                    fontSize: 13,
                    padding: "10px 12px",
                    outline: "none",
                  }}
                />
                <button
                  onClick={send}
                  disabled={!draft.trim()}
                  style={{
                    padding: "0 16px",
                    background: draft.trim()
                      ? "#F5A623"
                      : "rgba(245,166,35,.2)",
                    border: "none",
                    borderRadius: 6,
                    color: "#000",
                    fontFamily: "'DM Mono',monospace",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: draft.trim() ? "pointer" : "default",
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          )}

          {tab === "messages" && activeCrew && (
            <div>
              {(() => {
                const t = (crews || []).find((x) => x.id === activeCrew);
                return (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 10,
                    }}
                  >
                    <button
                      className="back-btn"
                      onClick={() => setActiveCrew(null)}
                    >
                      ←
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {renaming ? (
                        <input
                          autoFocus
                          value={renameVal}
                          onChange={(e) => setRenameVal(e.target.value)}
                          onBlur={() => {
                            onRenameCrew &&
                              onRenameCrew(activeCrew, renameVal.trim());
                            setRenaming(false);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") e.target.blur();
                            if (e.key === "Escape") setRenaming(false);
                          }}
                          placeholder={t ? crewName(t) : "Group name"}
                          style={{
                            width: "100%",
                            background: "#0c0c0c",
                            border: "1px solid #1e1e1e",
                            borderRadius: 5,
                            color: "#f0ede8",
                            fontFamily: "'Syne',sans-serif",
                            fontSize: 14,
                            padding: "6px 9px",
                            outline: "none",
                          }}
                        />
                      ) : (
                        <div
                          onClick={() => {
                            setRenameVal(t && t.name ? t.name : "");
                            setRenaming(true);
                          }}
                          title="Tap to rename"
                          style={{
                            fontFamily: "'Syne',sans-serif",
                            fontSize: 15,
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            cursor: "pointer",
                          }}
                        >
                          👥 {t ? crewName(t) : "Group"}{" "}
                          <span style={{ fontSize: 11, color: "#555" }}>✎</span>
                        </div>
                      )}
                      <div style={mono}>
                        {t
                          ? t.show_date +
                            " · " +
                            joinedCount(t) +
                            " in the group"
                          : ""}
                      </div>
                    </div>
                    <button
                      onClick={() => onLeaveCrew(activeCrew)}
                      style={{
                        background: "none",
                        border: "1px solid #2a2a2a",
                        color: "#666",
                        fontFamily: "'DM Mono',monospace",
                        fontSize: 10,
                        padding: "4px 9px",
                        borderRadius: 5,
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      Leave
                    </button>
                  </div>
                );
              })()}
              <div
                ref={listRef}
                style={{
                  maxHeight: "45vh",
                  overflowY: "auto",
                  padding: "4px 2px",
                }}
              >
                {crewMsgs.length === 0 && (
                  <div
                    style={{
                      color: "#666",
                      fontFamily: "'Syne',sans-serif",
                      fontSize: 13,
                      padding: "18px 0",
                      textAlign: "center",
                    }}
                  >
                    No messages yet — say hi to the crew 👋
                  </div>
                )}
                {crewMsgs.map((m) => {
                  const mine = m.sender_id === curUser.id;
                  const sender = users.find((u) => u.id === m.sender_id);
                  return (
                    <div
                      key={m.id}
                      style={{
                        display: "flex",
                        justifyContent: mine ? "flex-end" : "flex-start",
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "78%",
                          padding: "8px 12px",
                          borderRadius: 10,
                          background: mine
                            ? "rgba(245,166,35,.12)"
                            : "#161616",
                          border:
                            "1px solid " +
                            (mine ? "rgba(245,166,35,.3)" : "#222"),
                          fontFamily: "'Syne',sans-serif",
                          fontSize: 13,
                          color: "#f0ede8",
                        }}
                      >
                        {!mine && (
                          <div
                            style={{
                              fontFamily: "'DM Mono',monospace",
                              fontSize: 9,
                              color: sender ? sender.color : "#888",
                              marginBottom: 3,
                            }}
                          >
                            {sender ? sender.name : "Member"}
                          </div>
                        )}
                        {m.body}
                        <div
                          style={{
                            ...mono,
                            fontSize: 8,
                            marginTop: 4,
                            textAlign: mine ? "right" : "left",
                          }}
                        >
                          {timeAgo(m.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendCrew();
                  }}
                  placeholder="Message the crew…"
                  style={{
                    flex: 1,
                    background: "#0c0c0c",
                    border: "1px solid #1e1e1e",
                    borderRadius: 6,
                    color: "#f0ede8",
                    fontFamily: "'Syne',sans-serif",
                    fontSize: 13,
                    padding: "10px 12px",
                    outline: "none",
                  }}
                />
                <button
                  onClick={sendCrew}
                  disabled={!draft.trim()}
                  style={{
                    padding: "0 16px",
                    background: draft.trim()
                      ? "#F5A623"
                      : "rgba(245,166,35,.2)",
                    border: "none",
                    borderRadius: 6,
                    color: "#000",
                    fontFamily: "'DM Mono',monospace",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: draft.trim() ? "pointer" : "default",
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          )}

          {/* ── ACTIVITY ── */}
          {tab === "activity" && (
            <div>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                {[
                  ["all", "All"],
                  ["shows", "Shows"],
                  ["other", "Other"],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    style={chip(actFilter === id)}
                    onClick={() => setActFilter(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {filteredNotifs.length === 0 ? (
                <div
                  style={{
                    color: "#666",
                    fontFamily: "'Syne',sans-serif",
                    fontSize: 13,
                    padding: "24px 0",
                    textAlign: "center",
                  }}
                >
                  Nothing yet.
                </div>
              ) : (
                filteredNotifs.map((n) => {
                  const m = notifMsg(n);
                  return (
                    <div
                      key={n.id}
                      style={{
                        display: "flex",
                        gap: 10,
                        padding: "12px 0",
                        borderBottom: "1px solid #141414",
                      }}
                    >
                      <div style={{ fontSize: 17 }}>{m.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontFamily: "'Syne',sans-serif",
                            fontSize: 13,
                            color: "#ddd",
                            lineHeight: 1.5,
                          }}
                        >
                          {m.text}
                        </div>
                        <div style={{ ...mono, marginTop: 3 }}>
                          {timeAgo(n.created_at)}
                        </div>
                        {m.action === "no_show" && (
                          <div style={{ marginTop: 6 }}>
                            <button
                              onClick={onReportBug}
                              style={{
                                background: "none",
                                border: "1px solid #2a2a2a",
                                color: "#888",
                                fontSize: 10,
                                fontFamily: "'DM Mono',monospace",
                                padding: "4px 9px",
                                borderRadius: 5,
                                cursor: "pointer",
                              }}
                            >
                              Report
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
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
    rc = u === "urgent" ? "#FF5555" : "#F5A623";
  const showR = u === "urgent" || u === "soon";
  const isFestival = c.is_festival && c.end_date && c.end_date !== c.date;
  const crewBtn = {
    margin: "8px 0 2px",
    width: "100%",
    padding: "10px 0",
    background: "rgba(245,166,35,.06)",
    border: "1px solid rgba(245,166,35,.3)",
    borderRadius: 6,
    color: "#F5A623",
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
                      ? "#F5A623"
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
                color: "#F5A623",
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
                border: "1px solid #2a2a2a",
                borderRadius: 6,
                color: "#aaa",
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
                border: "1px solid " + (c.hidden ? "#3a3a3a" : "#2a2a2a"),
                borderRadius: 6,
                color: c.hidden ? "#ddd" : "#666",
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
                      color: "#F5A623",
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

// ── PROFILE PAGE ─────────────────────────────────────────────────────────────
// ── GENRE SEARCH (jump to any genre page) ────────────────────────────────────