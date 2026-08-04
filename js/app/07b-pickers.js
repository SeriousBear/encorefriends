// js/app/07b-pickers.js
//
// Input widgets split out of 07-forms.js: Spotify-backed artist search, OSM
// venue/city autocomplete, and the dark-theme date picker. Loads after
// 07-forms.js (its forms call these at render time) and before 09-main.js.
// Relies on globals from earlier modules + React hooks.

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
                <div className="tag-opt" style={{ color: "var(--fg4)" }}>
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
                  style={{ color: "var(--gold)" }}
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
            <div className="tag-opt" style={{ color: "var(--fg4)" }}>
              Searching…
            </div>
          )}
          {!loading && results.length === 0 && (
            <div className="tag-opt" style={{ color: "var(--fg4)" }}>
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
                  color: "var(--fg2)",
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
    color: "var(--gold)",
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
          color: value ? "#eee" : "var(--fg3)",
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>{label}</span>
        <span style={{ color: "var(--gold)" }}>▾</span>
      </button>
      {open && (
        <div
          style={{
            marginTop: 6,
            background: "var(--panel)",
            border: "1px solid var(--line)",
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
                  color: "var(--fg4)",
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
                    background: isSel ? "var(--gold)" : "transparent",
                    color: isSel ? "#000" : "var(--fg2)",
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
