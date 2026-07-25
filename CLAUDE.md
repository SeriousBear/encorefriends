# CLAUDE.md — working conventions for Encore

Guidance for any AI session working in this repo. Read before editing.

## Module size & splitting

The app has **no build step** — `app.html` loads each `js/app/*.js` file as
`<script type="text/babel">` and Babel Standalone transforms JSX in the browser.
Files share one global scope, so **load order in `app.html` is dependency order**
and `09-main.js` must load last. See `js/app/README.md` for the full model.

Keep modules small:

- **Target 400–800 lines per module.** Big enough to avoid file sprawl, small
  enough that any read/edit is cheap and the whole file fits in context.
- **Hard ceiling ~1,000 lines → split.** Split at the *next natural seam*
  (a component / screen / concern boundary), never mid-component just to hit a
  number. A cohesive 1,100-line component beats two tightly-coupled halves.
- **Don't split below ~300 lines** without a real reason — tiny files add
  load-order surface and global-scope collision risk for little gain.
- **One screen / concern per file** so an edit touches exactly one module.
- **Keep `// ── SECTION` headers** in every file. Clear seams let edits target a
  span by grep instead of reading the whole file — this matters as much as size.

When splitting: create the new `NN[x]-name.js`, move the block, add a
`<script>` tag in `app.html` **before** its first user (and before `09-main.js`),
and update the table in `js/app/README.md`.

## Verify before claiming done

- `npm test` (vitest) — parser unit tests + the hooks-order guard.
- Babel-transform any changed `js/app/*.js` (JSX must compile; there's no build
  step to catch errors).
- `npm run eval` (needs `ANTHROPIC_API_KEY`) when the parser prompt changes.

## Guardrails

- **Repo is the source of truth** — read current state before editing.
- **Edit in place**; no zips, no pasted code blocks.
- **Don't run git commands** — Kyle commits/pushes via GitHub Desktop.
- **No real secrets in committed files** — placeholders only; the repo is public.
  Proxy sensitive calls through Netlify functions.
- **Surgical, minimal edits** — don't reformat untouched code.
- Flag risky changes and manual steps (deploys, SQL migrations, browser checks).
- React hooks in `App` go **above** the early return in `09-main.js`, or the app
  black-screens. `tests/app-hooks-order.test.mjs` enforces this.

## Aesthetic tokens

bg `#070707`/`#0c0c0c`, cards `#111`, borders `#1e1e1e`, gold `#F5A623`.
Fonts: Bebas Neue (headers), DM Mono (labels — uppercase + letter-spacing),
Syne (body). Inline styles are fine in this codebase.
