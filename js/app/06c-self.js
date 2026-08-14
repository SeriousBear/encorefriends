/* ============================================================================
   06c-self.js — "your own profile" controls, split out of 06-profile.js to
   keep that file under the ~1,000-line ceiling. These render only for isSelf
   and are referenced inside ProfilePage's body, so load order vs 06-profile
   doesn't matter (resolved at call time). Loaded before 09-main.js.

   Exposes (global scope): VibePicker, InviteButton, HelpButton, HelpSheet.
   ============================================================================ */

// ── Vibe theme picker ──────────────────────────────────────────────────────
// Recolors the app accent (persisted in localStorage, applied by
// window.applyVibe defined in app.html so it runs before render). Cosmetic.
function VibePicker() {
  const vibes = [
    ["edm", "EDM"], ["house", "House"], ["techno", "Techno"],
    ["bass", "Bass"], ["trance", "Trance"], ["indie", "Indie"],
  ];
  const [sel, setSel] = useState(() => {
    try {
      return localStorage.getItem("encore_vibe") || "edm";
    } catch (e) {
      return "edm";
    }
  });
  return (
    <div className="vibe-pick">
      <div className="vibe-pick-lbl">Vibe</div>
      <div className="vibe-pick-row">
        {vibes.map(([k, l]) => (
          <button
            key={k}
            className={"vibe-chip" + (sel === k ? " on" : "")}
            onClick={() => {
              if (window.applyVibe) window.applyVibe(k);
              setSel(k);
            }}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Invite a friend ─────────────────────────────────────────────────────────
// The growth loop: friends follow each other to see (and get pulled into) the
// same shows. Native share where available, else copy the link.
function InviteButton({ user }) {
  const [copied, setCopied] = useState(false);
  async function invite() {
    const url = "https://encorefriends.com";
    const msg =
      "Follow me (@" +
      user.handle +
      ") on Encore so we can catch shows together — it tracks the concerts you've actually got tickets to. ";
    if (navigator.share) {
      try {
        await navigator.share({ title: "Encore", text: msg, url });
      } catch (e) {}
    } else {
      try {
        await navigator.clipboard.writeText(msg + url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      } catch (e) {}
    }
  }
  return (
    <button
      className="prof-follow-btn pf-follow"
      style={{
        background: "transparent",
        border: "1px solid var(--gold-border)",
        color: "var(--gold)",
      }}
      onClick={invite}
    >
      {copied ? "Link copied ✓" : "＋ Invite friends"}
    </button>
  );
}

// ── Help & FAQ ──────────────────────────────────────────────────────────────
const HELP_FAQS = [
  ["Is Encore free?", "Yes — Encore is free to use."],
  [
    "Do you read my inbox?",
    "Never. You forward only the ticket emails you want tracked — that's the only thing Encore ever sees. No mailbox access, no scanning.",
  ],
  [
    "How does forwarding work?",
    "Forward any ticket confirmation to your private Encore address. It reads the artist, venue and date and files the show for you automatically.",
  ],
  [
    "Which ticket platforms work?",
    "Any ticket email — Ticketmaster, SeatGeek, DICE, AXS, StubHub, Eventbrite and more.",
  ],
  [
    "Will my friends see everything?",
    "Only what you choose. You pick who to follow, and you can hide any show so it stays just for you.",
  ],
  [
    "Can I install it like an app?",
    "Yes — add Encore to your home screen for a native feel. On iPhone, use Safari's Share → “Add to Home Screen.”",
  ],
];

function HelpSheet({ onClose }) {
  const sw = useSwipeDismiss(onClose);
  const [open, setOpen] = useState(-1);
  return (
    <div
      className="mwrap"
      onClick={onClose}
      style={{ ...sw.backdropStyle, zIndex: 700 }}
    >
      <div
        className="sheet"
        onClick={(e) => e.stopPropagation()}
        style={{ ...sw.sheetStyle, maxWidth: 480 }}
        ref={sw.ref}
      >
        <div className="sheet-bar" style={{ background: "var(--gold)" }} />
        <div className="sheet-body">
          <div className="help-title">Help &amp; FAQ</div>
          {HELP_FAQS.map(([q, a], i) => (
            <div key={i} className={"help-item" + (open === i ? " on" : "")}>
              <button
                className="help-q"
                onClick={() => setOpen(open === i ? -1 : i)}
              >
                {q}
                <span className="help-pl">{open === i ? "–" : "+"}</span>
              </button>
              {open === i && <div className="help-a">{a}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HelpButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="prof-follow-btn pf-follow"
        style={{
          background: "transparent",
          border: "1px solid var(--line-2)",
          color: "var(--fg2)",
        }}
        onClick={() => setOpen(true)}
      >
        ？ Help &amp; FAQ
      </button>
      {open && <HelpSheet onClose={() => setOpen(false)} />}
    </>
  );
}
