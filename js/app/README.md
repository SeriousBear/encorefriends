# js/app/ — the app, split into ordered modules

This used to be one 8,000-line `js/app.js`. It's now nine files loaded in
order by `app.html`. **Concatenated in numeric order, they equal the old
single file byte-for-byte** — nothing was rewritten, only cut at top-level
declaration boundaries.

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
| 04 | `04-cards.js` | `CCard`, `SharePicker` |
| 05 | `05-inbox.js` | `InboxSheet`, `CDetail` |
| 06 | `06-profile.js` | `GenreSearch`, `ProfilePage`, `ArtistSheet`, `GenrePage` |
| 07 | `07-forms.js` | `TagSearch`, `EditProfilePage`, `SearchPage`, `LoginPage`, artist/place/date pickers |
| 08 | `08-onboard.js` | `MailConnect`, `Onboarding`, `AdminPage` |
| 09 | `09-main.js` | the `App` component + `ReactDOM.render` (**must be last**) |

## Editing tips

- To change a screen, edit its file (e.g. the genre page lives in
  `06-profile.js`) — you rarely need to touch the others.
- Adding a new component: define it in the file that uses it, or a new file
  loaded **before** its first user in `app.html`.
- Adding a React hook to `App`: put it **above** the
  `if (authLoading ...) return` early-return in `09-main.js`. Hooks below it
  cause the blank-screen crash. `tests/app-hooks-order.test.mjs` enforces this.

## Guardrails

`npm test` runs the parser unit tests and the hooks-order check. The
hooks-order test reads `09-main.js` — if the App component ever moves to a
different file, update the path in that test.
