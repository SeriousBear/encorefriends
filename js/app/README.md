# js/app/ — the app, split into ordered modules

This used to be one 8,000-line `js/app.js`. It's now split into ordered files
loaded by `app.html`, cut at top-level declaration boundaries. New screens are
added as their own module (kept under ~1,000 lines each) rather than growing an
existing file.

## Why it's split this way (no build step)

The app has no bundler — `app.html` loads each file as
`<script type="text/babel" src="...">` and Babel Standalone transforms the JSX
in the browser. Separate classic scripts **share one global scope**, so a
`const` or `function` defined in an earlier file is visible to later ones.
That's what makes the split work without imports/exports.

Two rules keep it working:

1. **Load order is dependency order.** A top-level constant that's built from
   another (e.g. `GENRES` is derived from `GENRE_TAXONOMY`) must come after
   what it depends on. Cross-file references *inside function bodies* are fine
   regardless of order — they resolve at call time, after everything loads.
2. **`09-main.js` loads last.** It defines `App` and calls
   `ReactDOM.render`. Nothing may load after it.

## The files

| # | File | Contains |
|---|------|----------|
| 01 | `01-config.js` | keys, Supabase client, platform detection, RESELLERS/STREAMS/SOURCES/MONTHS |
| 02 | `02-genres.js` | `GENRE_TAXONOMY`, genre helpers, `matchInfo` |
| 03 | `03-helpers.js` | date/format/vendor helpers, avatar colors |
| 03b | `03b-pwa.js` | platform-aware "add to home screen" nudge (vanilla) |
| 04 | `04-cards.js` | `CCard`, `SharePicker` |
| 05 | `05-inbox.js` | `InboxSheet` (one large, cohesive component — see note) |
| 05b | `05b-threads.js` | `CrewCreate`, `CDetail` |
| 06 | `06-profile.js` | `GenreSearch`, `ProfilePage`, `ArtistSheet`, `GenrePage` |
| 06b | `06b-tour.js` | `TourPage` — personal stats / genre passport / bucket list / paths crossed |
| 07 | `07-forms.js` | `TagSearch`, `EditProfilePage`, `SearchPage`, `LoginPage` |
| 07b | `07b-pickers.js` | `ArtistSearch`, `PlaceSearch`, `DatePicker` |
| 08 | `08-onboard.js` | `MailConnect`, `Onboarding` |
| 08b | `08b-admin.js` | `AdminPage` — the ⚙ dashboard |
| 09 | `09-main.js` | the `App` component + `ReactDOM.render` (**must be last**) |

> **Two known exceptions over the ~1,000-line ceiling:** `05-inbox.js`
> (`InboxSheet`) and `09-main.js` (`App`) are each a *single* component. Going
> smaller means extracting inner sub-components with explicit props — a deeper
> refactor best done against a smoke test, not a mechanical cut. Left intact for
> now rather than split mid-component.

## Module size

- **Target 400–800 lines per file; hard ceiling ~1,000 → split.** Split at the
  next natural component/concern seam, not mid-component. Don't split below
  ~300 lines without a real reason. Keep `// ── SECTION` headers so edits can
  target a span by grep. Full rationale in the root `CLAUDE.md`.

## Editing tips

- To change a screen, edit its file (e.g. the genre page lives in
  `06-profile.js`, the Tour page in `06b-tour.js`) — you rarely need to touch
  the others.
- Adding a new component: define it in the file that uses it, or a new file
  loaded **before** its first user in `app.html`.
- Adding a React hook to `App`: put it **above** the
  `if (authLoading ...) return` early-return in `09-main.js`. Hooks below it
  cause the blank-screen crash. `tests/app-hooks-order.test.mjs` enforces this.

## Guardrails

`npm test` runs the parser unit tests and the hooks-order check. The
hooks-order test reads `09-main.js` — if the App component ever moves to a
different file, update the path in that test.
