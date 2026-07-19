// evals/run-evals.mjs — scores the AI parser against the fixture library.
//
//   node evals/run-evals.mjs --dry     harness self-test, no API calls, free
//   ANTHROPIC_API_KEY=sk-... node evals/run-evals.mjs
//   node evals/run-evals.mjs --strict  exit 1 if anything fails (for CI)
//
// Each fixture in evals/fixtures/*.json:
//   { platform, description, email: { subject, from, body },
//     expected: { is_ticket, shows: [{ artist, date, end_date?,
//                 is_festival?, genres?[acceptable], venue?, city? }] } }
//
// PASS/FAIL fields: is_ticket, show count, artist, date, end_date,
// is_festival, genres (must be valid taxonomy + overlap expected).
// venue/city mismatches only WARN — synthetic emails shouldn't be brittle.

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  PARSE_SYSTEM,
  extractParseResult,
} from "../netlify/functions/parse-helpers.mjs";
import { ALL_GENRES } from "../netlify/functions/genre-taxonomy.mjs";

const DRY = process.argv.includes("--dry");
const STRICT = process.argv.includes("--strict");
const MODEL =
  process.argv.includes("--model")
    ? process.argv[process.argv.indexOf("--model") + 1]
    : "claude-sonnet-4-5";

const dir = join(dirname(fileURLToPath(import.meta.url)), "fixtures");
const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
if (!files.length) {
  console.error("No fixtures found in evals/fixtures/");
  process.exit(1);
}
if (!DRY && !process.env.ANTHROPIC_API_KEY) {
  console.error("Set ANTHROPIC_API_KEY, or use --dry for a harness self-test.");
  process.exit(1);
}

const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
const artistMatch = (a, b) => {
  const x = norm(a), y = norm(b);
  return x === y || (x && y && (x.includes(y) || y.includes(x)));
};

async function callModel(email) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1500,
      system: PARSE_SYSTEM,
      messages: [
        {
          role: "user",
          content:
            "Subject: " + (email.subject || "") +
            "\nFrom: " + (email.from || "") +
            "\n\n" + (email.body || ""),
        },
      ],
    }),
  });
  const data = await res.json();
  return (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
}

function scoreFixture(expected, got) {
  const fails = [];
  const warns = [];
  if (got.is_ticket !== !!expected.is_ticket)
    fails.push("is_ticket: expected " + !!expected.is_ticket + ", got " + got.is_ticket);
  const eShows = expected.shows || [];
  if (got.shows.length !== eShows.length)
    fails.push("show count: expected " + eShows.length + ", got " + got.shows.length);
  for (const e of eShows) {
    const g = got.shows.find((s) => artistMatch(s.artist, e.artist));
    if (!g) {
      fails.push("missing show: " + e.artist);
      continue;
    }
    if (g.date !== e.date) fails.push(e.artist + " date: expected " + e.date + ", got " + g.date);
    if (e.end_date && (g.end_date || g.date) !== e.end_date)
      fails.push(e.artist + " end_date: expected " + e.end_date + ", got " + g.end_date);
    if (e.is_festival !== undefined && !!g.is_festival !== !!e.is_festival)
      fails.push(e.artist + " is_festival: expected " + !!e.is_festival);
    const gg = Array.isArray(g.genres) ? g.genres : [];
    const invalid = gg.filter((x) => !ALL_GENRES.includes(x));
    if (invalid.length) fails.push(e.artist + " off-taxonomy genres: " + invalid.join(", "));
    if (e.genres && e.genres.length && !gg.some((x) => e.genres.includes(x)))
      fails.push(e.artist + " genres: expected one of [" + e.genres.join(", ") + "], got [" + gg.join(", ") + "]");
    if (e.venue && !norm(g.venue).includes(norm(e.venue)))
      warns.push(e.artist + " venue: expected ~" + e.venue + ", got " + (g.venue || "∅"));
    if (e.city && norm(g.city) !== norm(e.city))
      warns.push(e.artist + " city: expected " + e.city + ", got " + (g.city || "∅"));
  }
  return { fails, warns };
}

const byPlatform = {};
let passed = 0;
console.log((DRY ? "DRY RUN (harness self-test, no API calls)" : "Model: " + MODEL) + "\n");

for (const f of files) {
  const fx = JSON.parse(readFileSync(join(dir, f), "utf8"));
  const raw = DRY
    ? JSON.stringify(fx.expected)
    : await callModel(fx.email);
  const got = extractParseResult(raw);
  const { fails, warns } = scoreFixture(fx.expected, got);
  const ok = fails.length === 0;
  if (ok) passed++;
  const p = fx.platform || "other";
  byPlatform[p] = byPlatform[p] || { pass: 0, total: 0 };
  byPlatform[p].total++;
  if (ok) byPlatform[p].pass++;
  console.log((ok ? "✅" : "❌") + " " + f + "  (" + p + ")");
  fails.forEach((x) => console.log("     FAIL " + x));
  warns.forEach((x) => console.log("     warn " + x));
}

console.log("\n── Scorecard ──");
for (const [p, s] of Object.entries(byPlatform))
  console.log("  " + p.padEnd(16) + s.pass + "/" + s.total);
console.log("  " + "TOTAL".padEnd(16) + passed + "/" + files.length + "\n");

if (STRICT && passed < files.length) process.exit(1);
