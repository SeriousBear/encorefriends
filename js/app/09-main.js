function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [dbConcerts, setDbConcerts] = useState([]);
  const [profileChecked, setProfileChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load real profile from Supabase when session is ready
  useEffect(() => {
    if (!session) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setProfile(data);
        setProfileChecked(true);
      });
  }, [session]);

  // Load (or reload) the user's concerts from Supabase. Called on session load
  // and again after every scan, so the dashboard always reflects what's saved —
  // even when a re-scan finds only duplicates and returns nothing new.
  const reloadConcerts = async () => {
    const { data } = await supabase
      .from("concerts")
      .select("*, concert_attendees(user_id)")
      .order("date", { ascending: true });
    if (data)
      setDbConcerts(
        data.map((c) => ({
          ...c,
          attendees: (c.concert_attendees || []).map((a) => a.user_id),
        })),
      );
    setConcertsLoaded(true);
  };

  useEffect(() => {
    reloadConcerts();
  }, [session]);

  const [users, setUsers] = useState([]);
  const [myFollowing, setMyFollowing] = useState([]);

  // Load the people directory (all public profiles) + the follow graph, and
  // build each user's `following` list from the follows table.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: profs }, { data: fols }] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("follows").select("follower_id, following_id"),
      ]);
      if (cancelled || !profs) return;
      const followMap = {};
      (fols || []).forEach((f) => {
        if (!followMap[f.follower_id]) followMap[f.follower_id] = [];
        followMap[f.follower_id].push(f.following_id);
      });
      setUsers(
        profs.map((pr) => ({
          id: pr.id,
          name: pr.name || "User",
          handle: pr.handle || "",
          color: pr.color || "#F5A623",
          location: pr.location || "",
          bio: pr.bio || "",
          genres: pr.genres || [],
          artists: pr.artists || [],
          discoverable: !!pr.discoverable,
          bucketList: pr.bucket_list || [],
          vibe: pr.vibe || "both",
          totalShows: pr.total_shows || 0,
          social: pr.social || {},
          following: followMap[pr.id] || [],
          past: [],
          ratings: {},
        })),
      );
      if (session?.user?.id) setMyFollowing(followMap[session.user.id] || []);
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);
  const [view, setView] = useState("feed"); // "feed" | "search" | "profile" | "edit" | "genre"
  const [genreView, setGenreView] = useState(null); // current genre string when view==="genre"
  const [prevView, setPrevView] = useState("feed"); // where to go back from genre page
  const [genreStack, setGenreStack] = useState([]); // genre->genre nav history
  const [artistModal, setArtistModal] = useState(null); // artist name string for sheet overlay
  const [profileId, setProfileId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [showAuth, setShowAuth] = useState(false); // guest -> sign-in screen
  const [showPast, setShowPast] = useState(false); // collapse past shows
  const [detail, setDetail] = useState(null);
  const [pushState, setPushState] = useState("loading"); // loading|prompt|granted|denied|unsupported|ios-install
  const [installPrompt, setInstallPrompt] = useState(null); // deferred beforeinstallprompt
  const [installHidden, setInstallHidden] = useState(false);
  const [pushHidden, setPushHidden] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [inboxTab, setInboxTab] = useState("messages");
  const [activeThread, setActiveThread] = useState(null); // other user's id
  const [shareShow, setShareShow] = useState(null); // concert being shared
  const [actFilter, setActFilter] = useState("all");
  const [crews, setCrews] = useState([]); // group threads (one per show)
  const [activeCrew, setActiveCrew] = useState(null);
  const [crewCreateShow, setCrewCreateShow] = useState(null); // show being turned into a group
  const [otcHidden, setOtcHidden] = useState(() => {
    try {
      return localStorage.getItem("encore_otc_nudge") === "1";
    } catch (e) {
      return false;
    }
  });
  const [showBug, setShowBug] = useState(false);
  const [bugText, setBugText] = useState("");
  const [bugSending, setBugSending] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [mailConnect, setMailConnect] = useState(false); // forwarding walkthrough overlay
  const [mailDismissed, setMailDismissed] = useState(false);
  const [showAddC, setShowAddC] = useState(false);
  const [showAddF, setShowAddF] = useState(false); // desktop add friend
  const [newFN, setNewFN] = useState("");
  const [nc, setNc] = useState({
    artist: "",
    venue: "",
    city: "",
    date: "",
    source: "Ticketmaster",
  });
  const [notif, setNotif] = useState(null);
  const [errMsg, setErrMsg] = useState(null);
  const [pastShows] = useState([]);
  const [liveConcerts, setLiveConcerts] = useState([]);
  const [concertsLoaded, setConcertsLoaded] = useState(false);

  // Replace with real DB concerts when they load (could be empty for new users)
  useEffect(() => {
    if (!concertsLoaded) return;
    setLiveConcerts(dbConcerts);
  }, [dbConcerts, concertsLoaded]);

  // Detect push support + whether this browser is already subscribed.
  useEffect(() => {
    if (typeof navigator === "undefined") {
      setPushState("unsupported");
      return;
    }
    // iOS only allows push once the app lives on the home screen. Before that
    // the APIs simply aren't there, so tell them how to install instead of
    // silently showing nothing.
    if (isIOS() && !isStandalone()) {
      setPushState("ios-install");
      return;
    }
    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      typeof Notification === "undefined"
    ) {
      setPushState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setPushState("denied");
      return;
    }
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) =>
        setPushState(
          sub || Notification.permission === "granted" ? "granted" : "prompt",
        ),
      )
      .catch(() => setPushState("unsupported"));
  }, []);

  // Chrome/Edge/Brave fire this when the app is installable — stash it so we
  // can offer a one-tap Install button instead of making people dig in menus.
  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    const onInstalled = () => setInstallPrompt(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Live auto-popup: when a show is inserted (e.g. a forwarded ticket lands, or
  // another device adds one), slide it into the feed without a refresh.
  useEffect(() => {
    if (typeof supabase.channel !== "function") return;
    const ch = supabase
      .channel("concerts-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "concerts" },
        (payload) => {
          const c = payload.new;
          if (!c || !c.id) return;
          const mine = session?.user?.id && c.owner_id === session.user.id;
          setDbConcerts((p) =>
            p.some((x) => x.id === c.id)
              ? p
              : [...p, { ...c, attendees: mine ? [c.owner_id] : [] }],
          );
          if (mine) toast("🎟️ Added from your inbox — " + (c.artist || "show"));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [session]);

  // Load this user's notifications and keep the bell live.
  useEffect(() => {
    if (!session?.user?.id) {
      setNotifs([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      if (!cancelled && data) setNotifs(data);
    })();
    let ch;
    if (typeof supabase.channel === "function") {
      ch = supabase
        .channel("notifs-" + session.user.id)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: "user_id=eq." + session.user.id,
          },
          (payload) => {
            if (payload.new)
              setNotifs((p) =>
                p.some((n) => n.id === payload.new.id)
                  ? p
                  : [payload.new, ...p].slice(0, 30),
              );
          },
        )
        .subscribe();
    }
    return () => {
      cancelled = true;
      if (ch) supabase.removeChannel(ch);
    };
  }, [session]);

  // Load my messages and keep them live.
  useEffect(() => {
    if (!session?.user?.id) {
      setMsgs([]);
      return;
    }
    let cancelled = false;
    const uid = session.user.id;
    (async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or("sender_id.eq." + uid + ",recipient_id.eq." + uid)
        .order("created_at", { ascending: false })
        .limit(200);
      if (!cancelled && data) setMsgs(data);
    })();
    let mch;
    if (typeof supabase.channel === "function") {
      mch = supabase
        .channel("msgs-" + uid)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: "recipient_id=eq." + uid,
          },
          (payload) => {
            if (payload.new)
              setMsgs((p) =>
                p.some((m) => m.id === payload.new.id)
                  ? p
                  : [payload.new, ...p],
              );
          },
        )
        .subscribe();
    }
    return () => {
      cancelled = true;
      if (mch) supabase.removeChannel(mch);
    };
  }, [session]);

  // People I've blocked — their messages and requests disappear everywhere.
  const [myBlocks, setMyBlocks] = useState([]);
  useEffect(() => {
    if (!session?.user?.id) {
      setMyBlocks([]);
      return;
    }
    supabase
      .from("blocks")
      .select("blocked_id")
      .then(({ data }) => setMyBlocks((data || []).map((b) => b.blocked_id)));
  }, [session]);
  const blockUser = async (id) => {
    setMyBlocks((p) => (p.includes(id) ? p : [...p, id]));
    setActiveThread(null);
    await supabase
      .from("blocks")
      .insert({ blocker_id: session.user.id, blocked_id: id });
    toast("Blocked. They can't message you anymore.");
  };

  // Crew chats: RLS returns only crews I'm in or could join (I'm going).
  const loadCrews = async () => {
    if (!session?.user?.id) {
      setCrews([]);
      return;
    }
    const { data } = await supabase
      .from("threads")
      .select("*, thread_members(user_id, status, last_read_at)");
    if (data) setCrews(data);
  };
  useEffect(() => {
    loadCrews();
    if (!session?.user?.id || typeof supabase.channel !== "function") return;
    const ch = supabase
      .channel("crewbump-" + session.user.id)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "thread_messages" },
        (payload) => {
          if (payload.new)
            setCrews((p) =>
              p.map((t) =>
                t.id === payload.new.thread_id
                  ? { ...t, last_message_at: payload.new.created_at }
                  : t,
              ),
            );
        },
      )
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [session]);

  // Track "last active" for DAU/WAU (one lightweight write per app load).
  useEffect(() => {
    if (!session?.user?.id) return;
    supabase
      .from("profiles")
      .update({ last_active: new Date().toISOString() })
      .eq("id", session.user.id);
  }, [session]);

  // ── EARLY AUTH RETURNS (after all hooks) ──
  if (authLoading || (session && !profileChecked))
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#070707",
        }}
      >
        <div
          style={{
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: 32,
            letterSpacing: 6,
            color: "#F5A623",
            opacity: 0.4,
          }}
        >
          ENCORE
        </div>
      </div>
    );
  // Guests can browse the app read-only. They reach the sign-in screen by
  // tapping any "Sign up" CTA (which sets showAuth).
  if (!session && showAuth)
    return <LoginPage onBack={() => setShowAuth(false)} />;

  // Members must finish onboarding first. (A DB trigger auto-creates a profile
  // with a generated handle on signup, so we gate on the explicit `onboarded`
  // flag rather than an empty handle.)
  if (session && (!profile || !profile.onboarded))
    return (
      <Onboarding
        session={session}
        profile={profile}
        onComplete={(p) => {
          setProfile(p);
          if (FORWARDING_ENABLED) setMailConnect(true);
        }}
      />
    );

  // Build curUser from real Supabase profile, fallback to demo while loading
  const curUser = profile
    ? {
        id: session.user.id, // real UUID
        name: profile.name || session.user.user_metadata?.full_name || "User",
        handle: profile.handle || "",
        color: profile.color || "#F5A623",
        location: profile.location || "",
        bio: profile.bio || "",
        genres: profile.genres || [],
        artists: profile.artists || [],
        bucketList: profile.bucket_list || [],
        discoverable: !!profile.discoverable,
        vibe: profile.vibe || "both",
        totalShows: profile.total_shows || 0,
        social: profile.social || {},
        following: myFollowing,
        upcoming: [],
        past: [],
        ratings: {},
      }
    : {
        id: null,
        name: "Guest",
        handle: "",
        color: "#3a3a3a",
        location: "",
        bio: "",
        genres: [],
        artists: [],
        bucketList: [],
        vibe: "both",
        totalShows: 0,
        social: {},
        following: [],
        upcoming: [],
        past: [],
        ratings: {},
      };
  const isGuest = !session;
  const isAdmin = !!(profile && profile.is_admin);

  // Shared look for the inline banners above the feed.
  const bannerBox = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    background: "#111",
    border: "1px solid #1e1e1e",
    borderRadius: 8,
    padding: "12px 14px",
    marginBottom: 16,
  };
  const bannerTxt = {
    fontFamily: "'Syne',sans-serif",
    fontSize: 13,
    color: "#ccc",
    flex: 1,
    minWidth: 200,
    lineHeight: 1.45,
  };
  // Only ever show one banner at a time.
  const pushBannerShowing =
    !isGuest &&
    !pushHidden &&
    (pushState === "prompt" || pushState === "ios-install");
  // Any write action by a guest opens the sign-in screen instead.
  const requireAuth = () => {
    if (isGuest) {
      setShowAuth(true);
      return false;
    }
    return true;
  };
  const toast = (m, e) => {
    if (e) {
      setErrMsg(m);
      setTimeout(() => setErrMsg(null), 6000);
    } else {
      setNotif(m);
      setTimeout(() => setNotif(null), 3500);
    }
  };

  // ── Inbox: unread counts, sending, read receipts ──
  const unreadMsgCount = msgs.filter(
    (m) =>
      m.recipient_id === session?.user?.id &&
      !m.read &&
      !myBlocks.includes(m.sender_id),
  ).length;
  const crewUnreadCount = crews.filter((t) => {
    const me = (t.thread_members || []).find(
      (m) => m.user_id === session?.user?.id,
    );
    return (
      me &&
      me.status === "joined" &&
      t.last_message_at &&
      new Date(t.last_message_at) > new Date(me.last_read_at)
    );
  }).length;
  // Pending group invites addressed to me.
  const crewInviteCount = crews.filter((t) =>
    (t.thread_members || []).some(
      (m) => m.user_id === session?.user?.id && m.status === "invited",
    ),
  ).length;

  const sendMessage = async (toId, body, show) => {
    if (!session?.user?.id) return false;
    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: session.user.id,
        recipient_id: toId,
        body: body || "",
        show: show || null,
      })
      .select()
      .single();
    if (error) {
      toast("Couldn't send — " + error.message, true);
      return false;
    }
    setMsgs((p) => [data, ...p]);
    return true;
  };

  const markThreadRead = async (otherId) => {
    if (!session?.user?.id) return;
    const unread = msgs.some(
      (m) => m.sender_id === otherId && !m.read && m.recipient_id === session.user.id,
    );
    if (!unread) return;
    setMsgs((p) =>
      p.map((m) => (m.sender_id === otherId && !m.read ? { ...m, read: true } : m)),
    );
    await supabase
      .from("messages")
      .update({ read: true })
      .eq("recipient_id", session.user.id)
      .eq("sender_id", otherId)
      .eq("read", false);
  };

  const openThread = (id) => {
    if (!requireAuth()) return;
    setInboxTab("messages");
    setActiveCrew(null);
    setActiveThread(id);
    markThreadRead(id);
    setShowNotifs(true);
  };

  // Activity items are marked read when that tab is viewed (see InboxSheet).
  const markNotifsRead = async () => {
    const unread = notifs.filter((n) => !n.read);
    if (unread.length && session?.user?.id) {
      setNotifs((p) => p.map((n) => ({ ...n, read: true })));
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", session.user.id)
        .eq("read", false);
    }
  };
  const markCrewRead = async (tid) => {
    if (!session?.user?.id) return;
    const now = new Date().toISOString();
    setCrews((p) =>
      p.map((t) =>
        t.id === tid
          ? {
              ...t,
              thread_members: (t.thread_members || []).map((m) =>
                m.user_id === session.user.id
                  ? { ...m, last_read_at: now }
                  : m,
              ),
            }
          : t,
      ),
    );
    await supabase
      .from("thread_members")
      .update({ last_read_at: now })
      .eq("thread_id", tid)
      .eq("user_id", session.user.id);
  };
  const crewForShow = (c) =>
    c
      ? crews.find(
          (t) => t.show_artist === c.artist && t.show_date === c.date,
        )
      : null;
  // Open the "create a group" sheet for a show (name + pick followers).
  const openCrewCreate = (c) => {
    if (!requireAuth()) return;
    setDetail(null);
    setCrewCreateShow(c);
  };
  // Create a private group: custom name + a set of followers to invite.
  const createGroup = async (show, name, memberIds) => {
    if (!requireAuth()) return;
    const { data, error } = await supabase
      .from("threads")
      .insert({
        show_artist: show.artist,
        show_date: show.date,
        venue: show.venue || "",
        city: show.city || "",
        name: (name || "").trim() || null,
        created_by: session.user.id,
      })
      .select()
      .single();
    if (error) {
      toast("Couldn't create the group — " + error.message, true);
      return;
    }
    // Creator joins immediately.
    await supabase.from("thread_members").insert({
      thread_id: data.id,
      user_id: session.user.id,
      status: "joined",
    });
    // Invite the picked followers (they accept before they can chat).
    if (memberIds && memberIds.length) {
      await supabase.from("thread_members").insert(
        memberIds.map((uid) => ({
          thread_id: data.id,
          user_id: uid,
          status: "invited",
          invited_by: session.user.id,
        })),
      );
    }
    setCrewCreateShow(null);
    await loadCrews();
    openCrew(data.id);
  };
  const acceptInvite = async (tid) => {
    await supabase
      .from("thread_members")
      .update({ status: "joined", last_read_at: new Date().toISOString() })
      .eq("thread_id", tid)
      .eq("user_id", session.user.id);
    await loadCrews();
    openCrew(tid);
  };
  const declineInvite = async (tid) => {
    await supabase
      .from("thread_members")
      .delete()
      .eq("thread_id", tid)
      .eq("user_id", session.user.id);
    await loadCrews();
    toast("Invite declined.");
  };
  const renameCrew = async (tid, name) => {
    const clean = (name || "").trim();
    setCrews((p) =>
      p.map((t) => (t.id === tid ? { ...t, name: clean || null } : t)),
    );
    await supabase
      .from("threads")
      .update({ name: clean || null })
      .eq("id", tid);
  };
  const leaveCrew = async (tid) => {
    await supabase
      .from("thread_members")
      .delete()
      .eq("thread_id", tid)
      .eq("user_id", session.user.id);
    setActiveCrew(null);
    await loadCrews();
    toast("Left the crew.");
  };
  const openCrew = (tid) => {
    setInboxTab("messages");
    setActiveThread(null);
    setActiveCrew(tid);
    setShowNotifs(true);
  };
  const openNotifs = () => {
    setInboxTab(unreadMsgCount > 0 ? "messages" : "activity");
    setShowNotifs(true);
  };

  // Human-readable text for a notification row.
  const notifMsg = (n) => {
    const d = n.data || {};
    if (n.type === "forward_no_show")
      return {
        icon: "📭",
        text:
          "We got a forwarded email but couldn't read a show from it" +
          (d.subject ? " (“" + d.subject + "”)" : "."),
        action: "no_show",
      };
    if (n.type === "new_show")
      return {
        icon: "🎟️",
        text:
          (d.actor || "Someone you follow") +
          " added a show" +
          (d.artist ? " — " + d.artist : ""),
      };
    if (n.type === "taste_match")
      return {
        icon: "⚡",
        text:
          (d.artist || "A show") +
          " just got added — right up your alley" +
          (d.genres && d.genres[0] ? " (" + d.genres[0] + ")" : ""),
      };
    return { icon: "🔔", text: "New activity" };
  };

  // Submit a bug report with auto-captured context.
  const submitBug = async () => {
    if (!bugText.trim() || bugSending) return;
    setBugSending(true);
    try {
      await supabase.from("bug_reports").insert({
        user_id: session?.user?.id || null,
        message: bugText.trim(),
        context: {
          view,
          filter,
          isGuest,
          userAgent:
            typeof navigator !== "undefined" ? navigator.userAgent : "",
          url: typeof location !== "undefined" ? location.href : "",
          ts: new Date().toISOString(),
        },
      });
      setBugText("");
      setShowBug(false);
      toast("Thanks — your report was sent. 🐛");
    } catch (e) {
      toast("Couldn't send the report — try again.", true);
    } finally {
      setBugSending(false);
    }
  };

  // Ask permission, subscribe, and save the subscription to Supabase.
  const enablePush = async () => {
    if (!session?.user?.id) return;
    if (VAPID_PUBLIC_KEY === "YOUR_VAPID_PUBLIC_KEY_HERE") {
      toast("Push isn't configured yet.", true);
      return;
    }
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setPushState(perm === "denied" ? "denied" : "prompt");
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      const j = sub.toJSON();
      await supabase.from("push_subscriptions").upsert(
        {
          user_id: session.user.id,
          endpoint: j.endpoint,
          p256dh: j.keys.p256dh,
          auth: j.keys.auth,
        },
        { onConflict: "endpoint" },
      );
      setPushState("granted");
      toast("Notifications on! 🔔");
    } catch (e) {
      setPushState("prompt");
      // Brave disables web push unless the user turns it on themselves — say so
      // rather than showing a dead-end error.
      if (await isBrave()) {
        toast(
          "Brave blocks push by default. Open brave://settings/privacy, turn on “Use Google services for push messaging,” restart Brave, then try again.",
          true,
        );
      } else {
        toast("Couldn't enable notifications.", true);
      }
    }
  };

  const doInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    try {
      await installPrompt.userChoice;
    } catch (e) {
      /* dismissed */
    }
    setInstallPrompt(null);
  };

  const deleteConcert = async (cid) => {
    if (!requireAuth()) return;
    if (!confirm("Remove this show from your account? This can't be undone."))
      return;
    if (session?.user?.id) {
      await supabase.from("concert_attendees").delete().eq("concert_id", cid);
      await supabase
        .from("concerts")
        .delete()
        .eq("id", cid)
        .eq("owner_id", session.user.id);
    }
    setLiveConcerts((p) => p.filter((c) => c.id !== cid));
    toast("Show removed.");
  };

  const toggleAttendee = async (cid, uid) => {
    if (!requireAuth()) return;
    const c = liveConcerts.find((c) => c.id === cid);
    if (!c) return;
    const adding = !(c.attendees || []).includes(uid);
    setLiveConcerts((p) =>
      p.map((c) =>
        c.id !== cid
          ? c
          : {
              ...c,
              attendees: adding
                ? [...(c.attendees || []), uid]
                : (c.attendees || []).filter((i) => i !== uid),
            },
      ),
    );
    // RLS lets a user change only their OWN attendance, so persist just that.
    if (session?.user?.id && uid === session.user.id) {
      if (adding)
        await supabase
          .from("concert_attendees")
          .insert({ concert_id: cid, user_id: uid });
      else
        await supabase
          .from("concert_attendees")
          .delete()
          .eq("concert_id", cid)
          .eq("user_id", uid);
    }
    const u2 = users.find((u) => u.id === uid);
    if (adding && u2?.notify && uid !== curUser.id)
      toast(u2.name + " tagged on " + c.artist + " — notified!");
  };
  const toggleGoing = (cid) => toggleAttendee(cid, curUser.id);
  const toggleFollow = async (uid) => {
    if (!requireAuth()) return;
    if (uid === curUser.id) return;
    const u2 = users.find((u) => u.id === uid);
    const isF = myFollowing.includes(uid);
    setMyFollowing((p) => (isF ? p.filter((i) => i !== uid) : [...p, uid]));
    setUsers((p) =>
      p.map((u) =>
        u.id === curUser.id
          ? {
              ...u,
              following: isF
                ? u.following.filter((i) => i !== uid)
                : [...u.following, uid],
            }
          : u,
      ),
    );
    toast(
      isF
        ? "Unfollowed " + (u2?.name || "")
        : "Now following " + (u2?.name || "") + "!",
    );
    if (isF)
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", curUser.id)
        .eq("following_id", uid);
    else
      await supabase
        .from("follows")
        .insert({ follower_id: curUser.id, following_id: uid });
  };
  const toggleNotif = (e, uid) => {
    e?.stopPropagation();
    const u2 = users.find((u) => u.id === uid);
    setUsers((p) =>
      p.map((u) => (u.id === uid ? { ...u, notify: !u.notify } : u)),
    );
    if (!u2.notify) toast("Notifications on for " + u2.name);
  };
  const viewProfile = (uid) => {
    setProfileId(uid);
    setView("profile");
  };
  const saveProfile = async (draft) => {
    if (!requireAuth()) return;
    // Save to Supabase
    if (session?.user?.id) {
      await supabase
        .from("profiles")
        .update({
          name: draft.name,
          handle: draft.handle,
          color: draft.color,
          location: draft.location,
          bio: draft.bio,
          genres: draft.genres,
          artists: draft.artists,
          bucket_list: draft.bucketList,
          vibe: draft.vibe,
          total_shows: draft.totalShows ? parseInt(draft.totalShows) : 0,
          social: draft.social,
          discoverable: !!draft.discoverable,
        })
        .eq("id", session.user.id);
      setProfile((p) => ({
        ...p,
        ...draft,
        bucket_list: draft.bucketList,
        total_shows: draft.totalShows,
      }));
    }
    setView("profile");
  };
  // Open to Connect nudge: shown on the feed once someone has 3+ shows.
  const dismissOtc = () => {
    setOtcHidden(true);
    try {
      localStorage.setItem("encore_otc_nudge", "1");
    } catch (e) {
      /* private mode */
    }
  };
  const enableOtc = async () => {
    dismissOtc();
    await supabase
      .from("profiles")
      .update({ discoverable: true })
      .eq("id", session.user.id);
    setProfile((p) => ({ ...p, discoverable: true }));
    toast("You're open to connect 🔓");
  };

  // Per-show privacy: hidden shows are owner-only (enforced by RLS too).
  const toggleHidden = async (c) => {
    const v = !c.hidden;
    setDbConcerts((p) =>
      p.map((x) => (x.id === c.id ? { ...x, hidden: v } : x)),
    );
    setDetail((d) => (d && d.id === c.id ? { ...d, hidden: v } : d));
    await supabase.from("concerts").update({ hidden: v }).eq("id", c.id);
    toast(v ? "Going quietly 🤫" : "Show visible again 👁");
  };
  const openGenre = (genre) => {
    if (view === "genre") {
      // genre -> genre: push onto the stack, keep the original origin view
      setGenreStack((s) => [...s, genre]);
    } else {
      setPrevView(view);
      setGenreStack([genre]);
    }
    setGenreView(genre);
    setView("genre");
  };
  const openArtist = (name) => setArtistModal(name);
  const closeGenre = () => {
    // Pop one genre; fall back to the origin view only when the stack is empty.
    const ns = genreStack.slice(0, -1);
    if (ns.length > 0) {
      setGenreStack(ns);
      setGenreView(ns[ns.length - 1]);
    } else {
      setGenreStack([]);
      setGenreView(null);
      setView(prevView);
    }
  };

  const clearMyShows = async () => {
    if (!requireAuth()) return;
    if (session?.user?.id) {
      const { data: mine } = await supabase
        .from("concerts")
        .select("id")
        .eq("owner_id", session.user.id);
      const ids = (mine || []).map((r) => r.id);
      if (ids.length) {
        await supabase.from("concert_attendees").delete().in("concert_id", ids);
        // .select() returns the rows actually deleted, so we can verify it
        // worked rather than assume it did (a blocked delete returns none).
        const { data: del, error } = await supabase
          .from("concerts")
          .delete()
          .eq("owner_id", session.user.id)
          .select("id");
        if (error) {
          toast("Couldn't delete shows: " + error.message, true);
          return;
        }
        if (!del || del.length === 0) {
          toast(
            "Delete was blocked — add a delete policy in Supabase (RLS).",
            true,
          );
          return;
        }
      }
    }
    setLiveConcerts([]);
    setDbConcerts([]);
    toast("All shows cleared.");
  };

  const addManually = async () => {
    if (!requireAuth()) return;
    if (!nc.artist.trim() || !nc.date) return;
    if (!session?.user?.id) return;
    const { data, error } = await supabase
      .from("concerts")
      .insert({
        owner_id: session.user.id,
        artist: nc.artist.trim(),
        venue: nc.venue.trim(),
        city: nc.city.trim(),
        date: nc.date,
        end_date: nc.date,
        source: nc.source || "Other",
        ticket_url: "",
        is_festival: false,
        genres: [],
      })
      .select()
      .single();
    if (error) {
      toast("Couldn't add: " + error.message, true);
      return;
    }
    if (data)
      await supabase
        .from("concert_attendees")
        .insert({ concert_id: data.id, user_id: session.user.id });
    await reloadConcerts();
    setNc({
      artist: "",
      venue: "",
      city: "",
      date: "",
      source: "Ticketmaster",
    });
    setShowAddC(false);
    toast(nc.artist.trim() + " added!");
  };

  // ── DERIVED ──
  const followedIds = [curUser.id, ...curUser.following];
  const filtered =
    filter === "all"
      ? liveConcerts
      : filter === "mine"
        ? liveConcerts.filter((c) => (c.attendees || []).includes(curUser.id))
        : filter === "following"
          ? liveConcerts.filter((c) =>
              (c.attendees || []).some((a) => myFollowing.includes(a)),
            )
          : liveConcerts.filter((c) => (c.attendees || []).includes(filter));
  const upcomingF = filtered.filter((c) => daysUntil(c.date) >= 0);
  const pastF = filtered
    .filter((c) => daysUntil(c.date) < 0)
    .sort((a, b) => new Date(b.date) - new Date(a.date)); // most recent first
  const grouped = [...upcomingF]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .reduce((acc, c) => {
      const d = new Date(c.date + "T12:00:00"),
        k = d.getFullYear() + "-" + d.getMonth(),
        l = MONTHS[d.getMonth()] + " " + d.getFullYear();
      if (!acc[k]) acc[k] = { l, items: [] };
      acc[k].items.push(c);
      return acc;
    }, {});
  const followedFriends = users.filter(
    (u) => u.id !== curUser.id && curUser.following.includes(u.id),
  );
  const profileUser =
    profileId != null ? users.find((u) => u.id === profileId) : null;

  return (
    <>
      {/* Styles loaded from css/app.css */}
      <div className="app">
        {/* ── HEADER ── */}
        <header className="hdr">
          <div className="hdr-r1">
            <div onClick={() => setView("feed")} style={{ cursor: "pointer" }}>
              <div className="logo">ENCORE</div>
              <div className="logo-sub">CONCERT TRACKER</div>
            </div>
            <div className="hdr-icons">
              <button
                className={"icon-btn" + (view === "search" ? " active" : "")}
                onClick={() => setView(view === "search" ? "feed" : "search")}
                title="Discover people"
              >
                ⌕
              </button>
              {isGuest ? (
                <button
                  className="btn-sm btn-amber"
                  onClick={() => setShowAuth(true)}
                >
                  Sign up
                </button>
              ) : (
                <>
                  <button
                    className="icon-btn"
                    onClick={openNotifs}
                    title="Notifications"
                    style={{ position: "relative" }}
                  >
                    🔔
                    {(notifs.some((n) => !n.read) ||
                      unreadMsgCount + crewUnreadCount > 0) && (
                      <span
                        style={{
                          position: "absolute",
                          top: -3,
                          right: -3,
                          minWidth: 15,
                          height: 15,
                          padding: "0 3px",
                          borderRadius: 8,
                          background: "#F5A623",
                          color: "#000",
                          fontSize: 9,
                          fontWeight: 700,
                          fontFamily: "'DM Mono',monospace",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          lineHeight: 1,
                        }}
                      >
                        {(() => {
                          const u =
                            notifs.filter((n) => !n.read).length +
                            unreadMsgCount +
                            crewUnreadCount;
                          return u > 9 ? "9+" : u;
                        })()}
                      </span>
                    )}
                  </button>
                  <div
                    className="my-avatar"
                    style={{ background: curUser.color }}
                    onClick={() => viewProfile(curUser.id)}
                    title="My profile"
                  >
                    {curUser.name.slice(0, 2).toUpperCase()}
                  </div>
                  {isAdmin && (
                    <button
                      className="icon-btn"
                      onClick={() => setShowAdmin(true)}
                      title="Admin"
                    >
                      ⚙
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      // Hard redirect: guarantees clean state instead of the
                      // app re-rendering stale views with no session.
                      window.location.href = "/";
                    }}
                    style={{
                      background: "transparent",
                      border: "1px solid #1e1e1e",
                      color: "#555",
                      padding: "6px 10px",
                      fontFamily: "'Syne',sans-serif",
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      cursor: "pointer",
                      borderRadius: 3,
                    }}
                  >
                    Out
                  </button>
                </>
              )}
            </div>
          </div>
          {view === "feed" && (
            <div className="hdr-r2">
              {isGuest ? (
                <button
                  className="btn-sm btn-amber"
                  onClick={() => setShowAuth(true)}
                >
                  Sign up to track your shows →
                </button>
              ) : (
                <>
                  <button
                    className="btn-sm btn-amber"
                    onClick={() => setShowAddC(true)}
                  >
                    + Add
                  </button>
                </>
              )}
            </div>
          )}
        </header>

        {/* ── MOBILE FILTER BAR (feed only) ── */}
        {view === "feed" && (
          <div className="fbar">
            <button
              className={"chip" + (filter === "all" ? " active" : "")}
              onClick={() => setFilter("all")}
            >
              All <span className="chip-cnt">{liveConcerts.length}</span>
            </button>
            <button
              className={"chip" + (filter === "mine" ? " active" : "")}
              onClick={() => setFilter("mine")}
            >
              Mine{" "}
              <span className="chip-cnt">
                {
                  liveConcerts.filter((c) =>
                    (c.attendees || []).includes(curUser.id),
                  ).length
                }
              </span>
            </button>
            {!isGuest && myFollowing.length > 0 && (
              <button
                className={"chip" + (filter === "following" ? " active" : "")}
                onClick={() => setFilter("following")}
              >
                Following{" "}
                <span className="chip-cnt">
                  {
                    liveConcerts.filter((c) =>
                      (c.attendees || []).some((a) => myFollowing.includes(a)),
                    ).length
                  }
                </span>
              </button>
            )}
            <div className="chip-div" />
            {followedFriends.map((f) => (
              <button
                key={f.id}
                className={"chip" + (filter === f.id ? " active" : "")}
                onClick={() => setFilter(filter === f.id ? "all" : f.id)}
              >
                <div className="chip-av" style={{ background: f.color }}>
                  {f.name.slice(0, 2).toUpperCase()}
                </div>
                {f.name}
                <span className="chip-cnt">
                  {
                    liveConcerts.filter((c) =>
                      (c.attendees || []).includes(f.id),
                    ).length
                  }
                </span>
              </button>
            ))}
            <button
              className="chip"
              style={{ borderStyle: "dashed", color: "#555" }}
              onClick={() => setView("search")}
            >
              + Follow
            </button>
          </div>
        )}

        <div className="body">
          {/* ── DESKTOP SIDEBAR ── */}
          {view === "feed" && (
            <aside className="sidebar">
              <div className="sb-lbl">Browse</div>
              <button
                className={"sb-btn" + (filter === "all" ? " active" : "")}
                onClick={() => setFilter("all")}
              >
                All Shows <span className="sb-cnt">{liveConcerts.length}</span>
              </button>
              <button
                className={"sb-btn" + (filter === "mine" ? " active" : "")}
                onClick={() => setFilter("mine")}
              >
                My Tickets{" "}
                <span className="sb-cnt">
                  {
                    liveConcerts.filter((c) =>
                      (c.attendees || []).includes(curUser.id),
                    ).length
                  }
                </span>
              </button>
              <div className="sb-lbl">Following</div>
              {followedFriends.map((f) => (
                <div key={f.id} className="sb-frow">
                  <button
                    className={"sb-btn" + (filter === f.id ? " active" : "")}
                    style={{ flex: 1 }}
                    onClick={() => setFilter(filter === f.id ? "all" : f.id)}
                  >
                    <div className="sb-fav" style={{ background: f.color }}>
                      {f.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="sb-fname">{f.name}</span>
                    <span className="sb-fcnt">
                      {
                        liveConcerts.filter((c) =>
                          (c.attendees || []).includes(f.id),
                        ).length
                      }
                    </span>
                  </button>
                  <button
                    className={"ntgl " + (f.notify ? "on" : "off")}
                    onClick={(e) => toggleNotif(e, f.id)}
                  />
                  <button
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#444",
                      fontSize: 11,
                      padding: "3px 2px",
                    }}
                    onClick={() => viewProfile(f.id)}
                    title={"View " + f.name + "'s profile"}
                  >
                    ↗
                  </button>
                </div>
              ))}
              <button className="sb-add" onClick={() => setView("search")}>
                ⌕ Discover &amp; follow
              </button>
            </aside>
          )}

          {/* ── MAIN VIEWS ── */}
          {view === "search" && (
            <SearchPage
              users={users}
              curUser={curUser}
              concerts={liveConcerts}
              onFollowToggle={toggleFollow}
              onViewProfile={viewProfile}
              onGenreClick={openGenre}
            />
          )}
          {view === "profile" && profileUser && (
            <ProfilePage
              user={profileUser}
              curUser={curUser}
              concerts={liveConcerts}
              pastShows={pastShows}
              users={users}
              onBack={() => setView("feed")}
              onFollowToggle={toggleFollow}
              onOpenConcert={setDetail}
              onViewProfile={viewProfile}
              onEdit={() => setView("edit")}
              onMessage={openThread}
              onGenreClick={openGenre}
              onArtistClick={openArtist}
            />
          )}
          {view === "edit" && (
            <EditProfilePage
              user={curUser}
              onBack={() => setView("profile")}
              onSave={saveProfile}
              onClearShows={clearMyShows}
              showCount={
                liveConcerts.filter((c) => c.owner_id === curUser.id).length
              }
            />
          )}
          {view === "genre" && genreView && (
            <GenrePage
              genre={genreView}
              users={users}
              curUser={curUser}
              concerts={liveConcerts}
              onBack={closeGenre}
              onFollowToggle={toggleFollow}
              onViewProfile={viewProfile}
              onArtistClick={openArtist}
              onGenreClick={openGenre}
            />
          )}
          {view === "feed" && (
            <main className="main">
              {notif && <div className="toast-ok">🔔 {notif}</div>}
              {errMsg && <div className="toast-err">⚠ {errMsg}</div>}
              {!isGuest && pushState === "ios-install" && !pushHidden && (
                <div style={bannerBox}>
                  <span style={bannerTxt}>
                    {isIOSNonSafari()
                      ? "🔔 To get show alerts on iPhone, open encorefriends.com in Safari, then tap Share → Add to Home Screen."
                      : "🔔 Want a ping when friends add a show? Tap Share, then “Add to Home Screen” — iPhone only sends alerts to installed apps."}
                  </span>
                  <button
                    className="btn-sm"
                    onClick={() => setPushHidden(true)}
                    style={{ color: "#777" }}
                  >
                    Got it
                  </button>
                </div>
              )}
              {!isGuest &&
                !curUser.discoverable &&
                !otcHidden &&
                liveConcerts.filter((c) =>
                  (c.attendees || []).includes(curUser.id),
                ).length >= 3 && (
                  <div
                    style={{
                      background: "rgba(245,166,35,.05)",
                      border: "1px solid rgba(245,166,35,.25)",
                      borderRadius: 10,
                      padding: "13px 15px",
                      marginBottom: 14,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Syne',sans-serif",
                        fontSize: 13,
                        color: "#f0ede8",
                        flex: 1,
                        minWidth: 220,
                      }}
                    >
                      🔓 You've got{" "}
                      {
                        liveConcerts.filter((c) =>
                          (c.attendees || []).includes(curUser.id),
                        ).length
                      }{" "}
                      shows tracked. Open your profile and find the people who
                      go to the same ones.
                    </span>
                    <button
                      onClick={enableOtc}
                      style={{
                        background: "#F5A623",
                        border: "none",
                        color: "#000",
                        padding: "7px 13px",
                        borderRadius: 6,
                        fontFamily: "'DM Mono',monospace",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Open to Connect
                    </button>
                    <button
                      onClick={dismissOtc}
                      style={{
                        background: "none",
                        border: "1px solid #2a2a2a",
                        color: "#666",
                        padding: "7px 11px",
                        borderRadius: 6,
                        fontFamily: "'DM Mono',monospace",
                        fontSize: 11,
                        cursor: "pointer",
                      }}
                    >
                      Not now
                    </button>
                  </div>
                )}
              {!isGuest && pushState === "prompt" && !pushHidden && (
                <div style={bannerBox}>
                  <span style={bannerTxt}>
                    🔔 Get a ping when people you follow add a show.
                  </span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn-sm btn-amber" onClick={enablePush}>
                      Enable
                    </button>
                    {installPrompt && (
                      <button className="btn-sm" onClick={doInstall}>
                        Install app
                      </button>
                    )}
                    <button
                      className="btn-sm"
                      onClick={() => setPushHidden(true)}
                      style={{ color: "#777" }}
                    >
                      Not now
                    </button>
                  </div>
                </div>
              )}
              {!isGuest &&
                installPrompt &&
                !installHidden &&
                !pushBannerShowing && (
                  <div style={bannerBox}>
                    <span style={bannerTxt}>
                      📲 Install Encore for quicker access and reliable alerts.
                    </span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn-sm btn-amber" onClick={doInstall}>
                        Install
                      </button>
                      <button
                        className="btn-sm"
                        onClick={() => setInstallHidden(true)}
                        style={{ color: "#777" }}
                      >
                        Not now
                      </button>
                    </div>
                  </div>
                )}
              {FORWARDING_ENABLED &&
                !isGuest &&
                !profile?.forward_verified &&
                !mailDismissed &&
                !pushBannerShowing && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                      background: "#111",
                      border: "1px solid #1e1e1e",
                      borderRadius: 8,
                      padding: "12px 14px",
                      marginBottom: 16,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Syne',sans-serif",
                        fontSize: 13,
                        color: "#ccc",
                      }}
                    >
                      📥 Add your shows automatically from email — about a
                      minute to set up.
                    </span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="btn-sm btn-amber"
                        onClick={() => setMailConnect(true)}
                      >
                        Set up
                      </button>
                      <button
                        className="btn-sm"
                        onClick={() => setMailDismissed(true)}
                        style={{ color: "#777" }}
                      >
                        Not now
                      </button>
                    </div>
                  </div>
                )}
              <div className="pg-head">
                <div className="pg-title">
                  {filter === "all"
                    ? "All Shows"
                    : filter === "mine"
                      ? "My Tickets"
                      : (
                          (users.find((u) => u.id === filter)?.name || "") +
                          "'s Shows"
                        ).toUpperCase()}
                </div>
                <div className="pg-cnt">{filtered.length} shows</div>
              </div>
              {liveConcerts.length > 0 && (
                <div className="legend">
                  <div className="leg">
                    <div className="led" style={{ background: "#FF5050" }} />
                    Within 2 weeks
                  </div>
                  <div className="leg">
                    <div className="led" style={{ background: "#F5A623" }} />
                    Within 30 days
                  </div>
                  <div className="leg">
                    <div className="led" style={{ background: "#2a2a2a" }} />
                    Further out
                  </div>
                </div>
              )}
              {liveConcerts.length === 0 ? (
                <div className="empty">
                  <div className="empty-i">🎵</div>
                  <div className="empty-t">No Shows Yet</div>
                  <div className="empty-s">
                    Add a show manually, or forward a ticket to track it
                    automatically.
                  </div>
                </div>
              ) : filtered.length === 0 ? (
                <div className="empty">
                  <div className="empty-i">🎫</div>
                  <div className="empty-t">No Shows Here</div>
                </div>
              ) : (
                <>
                  {Object.values(grouped).map(({ l, items }) => (
                    <div key={l} className="sec">
                      <div className="sec-hdr">{l}</div>
                      <div className="grid">
                        {items.map((c) => (
                          <CCard
                            key={c.id}
                            c={c}
                            users={users}
                            curUser={curUser}
                            onOpen={setDetail}
                            onToggleGoing={toggleGoing}
                            onViewProfile={viewProfile}
                            onDelete={deleteConcert}
                            onGenreClick={openGenre}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                  {Object.keys(grouped).length === 0 && pastF.length > 0 && (
                    <div className="empty">
                      <div className="empty-i">✓</div>
                      <div className="empty-t">Nothing upcoming</div>
                    </div>
                  )}
                  {pastF.length > 0 && (
                    <div className="sec">
                      <div
                        onClick={() => setShowPast((s) => !s)}
                        style={{
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          color: "#666",
                          fontFamily: "'DM Mono',monospace",
                          fontSize: 11,
                          letterSpacing: 2,
                          textTransform: "uppercase",
                          margin: "28px 0 14px",
                        }}
                      >
                        {showPast ? "▾" : "▸"} Past shows ({pastF.length})
                      </div>
                      {showPast && (
                        <div className="grid">
                          {pastF.map((c) => (
                            <CCard
                              key={c.id}
                              c={c}
                              users={users}
                              curUser={curUser}
                              onOpen={setDetail}
                              onToggleGoing={toggleGoing}
                              onViewProfile={viewProfile}
                              onDelete={deleteConcert}
                              onGenreClick={openGenre}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </main>
          )}
        </div>
      </div>

      {/* SCAN OVERLAY */}
      {FORWARDING_ENABLED && mailConnect && (
        <MailConnect
          session={session}
          profile={profile}
          onTokenReady={(t) =>
            setProfile((p) => ({ ...(p || {}), forward_token: t }))
          }
          onClose={() => setMailConnect(false)}
        />
      )}

      {/* NOTIFICATIONS PANEL */}
      {showNotifs && (
        <InboxSheet
          curUser={curUser}
          users={users}
          msgs={msgs}
          notifs={notifs}
          notifMsg={notifMsg}
          tab={inboxTab}
          setTab={setInboxTab}
          activeThread={activeThread}
          setActiveThread={(id) => {
            setActiveCrew(null);
            setActiveThread(id);
            if (id) markThreadRead(id);
          }}
          crews={crews}
          activeCrew={activeCrew}
          setActiveCrew={setActiveCrew}
          onLeaveCrew={leaveCrew}
          onCrewRead={markCrewRead}
          actFilter={actFilter}
          setActFilter={setActFilter}
          onSend={sendMessage}
          onClose={() => {
            setShowNotifs(false);
            setActiveThread(null);
            setActiveCrew(null);
          }}
          onViewProfile={(id) => {
            setShowNotifs(false);
            viewProfile(id);
          }}
          onReportBug={() => {
            setShowNotifs(false);
            setShowBug(true);
          }}
          onMarkActivityRead={markNotifsRead}
          myBlocks={myBlocks}
          onBlock={blockUser}
          onAcceptInvite={acceptInvite}
          onDeclineInvite={declineInvite}
          onRenameCrew={renameCrew}
        />
      )}

      {/* BUG REPORT */}
      {showBug && (
        <div className="mwrap" onClick={() => setShowBug(false)}>
          <div
            className="sheet"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 460 }}
          >
            <div className="sheet-bar" style={{ background: "#F5A623" }} />
            <div style={{ padding: "10px 18px 22px" }}>
              <div
                style={{
                  fontFamily: "'Bebas Neue',sans-serif",
                  fontSize: 24,
                  color: "#fff",
                  letterSpacing: 1,
                  marginBottom: 6,
                }}
              >
                Report a bug
              </div>
              <div
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontSize: 12.5,
                  color: "#888",
                  marginBottom: 12,
                  lineHeight: 1.5,
                }}
              >
                Hit something weird? Tell us what happened — we grab the
                technical details automatically.
              </div>
              <textarea
                value={bugText}
                onChange={(e) => setBugText(e.target.value)}
                placeholder="What went wrong, and what were you doing?"
                rows={5}
                className="form-inp"
                style={{
                  width: "100%",
                  resize: "vertical",
                  fontFamily: "'Syne',sans-serif",
                }}
              />
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 12,
                  justifyContent: "flex-end",
                }}
              >
                <button
                  className="btn-sm"
                  onClick={() => setShowBug(false)}
                  style={{ color: "#888" }}
                >
                  Cancel
                </button>
                <button
                  className="btn-sm btn-amber"
                  onClick={submitBug}
                  disabled={bugSending || !bugText.trim()}
                >
                  {bugSending ? "Sending…" : "Send report"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAdmin && showAdmin && (
        <AdminPage onBack={() => setShowAdmin(false)} />
      )}

      {/* ADD CONCERT SHEET */}
      {showAddC && (
        <div className="mwrap" onClick={() => setShowAddC(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-bar" style={{ background: "#F5A623" }} />
            <div className="sheet-handle" />
            <div className="sheet-body">
              <div className="sh-artist">Add a Show</div>
              <div className="sh-venue" style={{ marginBottom: 16 }}>
                Manually add a concert the scanner missed
              </div>
              <div className="form-row">
                <div className="form-lbl">Artist *</div>
                <ArtistSearch
                  value={nc.artist ? [nc.artist] : []}
                  max={1}
                  placeholder="Search artist…"
                  onChange={(a) => setNc((p) => ({ ...p, artist: a[0] || "" }))}
                />
              </div>
              <div className="form-row">
                <div className="form-lbl">Venue &amp; City</div>
                <PlaceSearch
                  placeholder="Search venue or address…"
                  onPick={(pl) =>
                    setNc((p) => ({
                      ...p,
                      venue: pl.venue || p.venue,
                      city: pl.city || p.city,
                    }))
                  }
                />
                <div className="form-grid" style={{ marginTop: 8 }}>
                  <input
                    className="form-inp"
                    placeholder="Venue"
                    value={nc.venue}
                    onChange={(e) =>
                      setNc((p) => ({ ...p, venue: e.target.value }))
                    }
                  />
                  <input
                    className="form-inp"
                    placeholder="City, State"
                    value={nc.city}
                    onChange={(e) =>
                      setNc((p) => ({ ...p, city: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-lbl">Date *</div>
                <DatePicker
                  value={nc.date}
                  onChange={(d) => setNc((p) => ({ ...p, date: d }))}
                />
              </div>
              <div className="form-row" style={{ marginTop: 11 }}>
                <div className="form-lbl">Source</div>
                <select
                  className="form-sel"
                  value={nc.source}
                  onChange={(e) =>
                    setNc((p) => ({ ...p, source: e.target.value }))
                  }
                >
                  {SOURCES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <button className="form-btn" onClick={addManually}>
                Add Concert
              </button>
              <button className="sh-close" onClick={() => setShowAddC(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONCERT DETAIL */}
      {detail && (
        <CDetail
          c={detail}
          users={users}
          curUser={curUser}
          onClose={() => setDetail(null)}
          onToggleAttendee={toggleAttendee}
          onViewProfile={viewProfile}
          onGenreClick={(g) => {
            setDetail(null);
            openGenre(g);
          }}
          onShare={(cc) => setShareShow(cc)}
          onToggleHidden={toggleHidden}
          myGroups={crews.filter(
            (t) =>
              t.show_artist === detail.artist &&
              t.show_date === detail.date &&
              (t.thread_members || []).some(
                (m) => m.user_id === curUser.id && m.status === "joined",
              ),
          )}
          onStartGroup={openCrewCreate}
          onOpenCrew={openCrew}
        />
      )}
      {shareShow && (
        <SharePicker
          c={shareShow}
          users={users}
          curUser={curUser}
          onClose={() => setShareShow(null)}
          onSend={async (uid) => {
            const okd = await sendMessage(uid, "", {
              artist: shareShow.artist,
              venue: shareShow.venue || "",
              city: shareShow.city || "",
              date: shareShow.date,
            });
            if (okd) {
              const u2 = users.find((x) => x.id === uid);
              toast("Shared with " + (u2 ? u2.name : "friend") + " 🎟");
            }
            setShareShow(null);
          }}
        />
      )}
      {crewCreateShow && (
        <CrewCreate
          show={crewCreateShow}
          curUser={curUser}
          users={users}
          onClose={() => setCrewCreateShow(null)}
          onCreate={createGroup}
        />
      )}
      {artistModal && (
        <ArtistSheet
          artistName={artistModal}
          concerts={liveConcerts}
          onClose={() => setArtistModal(null)}
          onOpenConcert={(c) => {
            setArtistModal(null);
            setDetail(c);
          }}
        />
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
