// Unit tests for the deterministic half of the email parser.
// Run: npm test    (no network, no API key needed)
import { describe, it, expect } from "vitest";
import {
  PARSE_SYSTEM,
  FORWARD_DOMAIN,
  tokenFromAddress,
  extractParseResult,
  buildConcertRow,
} from "../netlify/functions/parse-helpers.mjs";
import {
  canonicalizeGenres,
  ALL_GENRES,
  GENRE_PARENTS,
} from "../netlify/functions/genre-taxonomy.mjs";

describe("tokenFromAddress", () => {
  it("extracts the token from a plain forward address", () => {
    expect(tokenFromAddress("abc123@encorefriends.com")).toBe("abc123");
  });
  it("is case-insensitive on the domain", () => {
    expect(tokenFromAddress("abc123@EncoreFriends.COM")).toBe("abc123");
  });
  it("finds the address inside a display-name header", () => {
    expect(tokenFromAddress("Kyle <k.w-1@encorefriends.com>")).toBe("k.w-1");
  });
  it("rejects other domains (no cross-domain token leaks)", () => {
    expect(tokenFromAddress("abc123@gmail.com")).toBeNull();
    expect(tokenFromAddress("abc123@notencorefriends.com")).toBeNull();
  });
  it("handles null/empty", () => {
    expect(tokenFromAddress(null)).toBeNull();
    expect(tokenFromAddress("")).toBeNull();
  });
});

describe("extractParseResult", () => {
  it("parses a clean JSON reply", () => {
    const r = extractParseResult(
      '{"is_ticket": true, "shows": [{"artist": "GWAR"}]}',
    );
    expect(r.is_ticket).toBe(true);
    expect(r.shows).toHaveLength(1);
  });
  it("finds JSON wrapped in prose", () => {
    const r = extractParseResult(
      'Here is the result:\n{"is_ticket": false, "shows": []}\nHope that helps!',
    );
    expect(r.is_ticket).toBe(false);
    expect(r.shows).toEqual([]);
  });
  it("degrades malformed JSON to not-a-ticket instead of throwing", () => {
    expect(extractParseResult('{"is_ticket": tru')).toEqual({
      is_ticket: false,
      shows: [],
    });
    expect(extractParseResult("")).toEqual({ is_ticket: false, shows: [] });
    expect(extractParseResult(null)).toEqual({ is_ticket: false, shows: [] });
  });
  it("coerces a non-array shows field", () => {
    const r = extractParseResult('{"is_ticket": true, "shows": "nope"}');
    expect(r.shows).toEqual([]);
  });
});

describe("buildConcertRow", () => {
  const uid = "user-1";
  it("skips shows missing artist or date", () => {
    expect(buildConcertRow(null, uid)).toBeNull();
    expect(buildConcertRow({ date: "2026-09-01" }, uid)).toBeNull();
    expect(buildConcertRow({ artist: "GWAR" }, uid)).toBeNull();
  });
  it("defaults end_date to date for single-day shows", () => {
    const row = buildConcertRow({ artist: "GWAR", date: "2026-12-10" }, uid);
    expect(row.end_date).toBe("2026-12-10");
    expect(row.is_festival).toBe(false);
    expect(row.venue).toBe("");
    expect(row.source).toBe("Email");
    expect(row.ticket_url).toBe("");
    expect(row.owner_id).toBe(uid);
  });
  it("keeps festival end dates", () => {
    const row = buildConcertRow(
      {
        artist: "Movement Festival",
        date: "2026-05-23",
        end_date: "2026-05-25",
        is_festival: true,
      },
      uid,
    );
    expect(row.end_date).toBe("2026-05-25");
    expect(row.is_festival).toBe(true);
  });
  it("canonicalizes genres and drops junk", () => {
    const row = buildConcertRow(
      { artist: "X", date: "2026-01-01", genres: ["dnb", "Not A Genre"] },
      uid,
    );
    expect(row.genres).toEqual(["Drum & Bass"]);
  });
  it("stamps scanned_at from the injected clock", () => {
    const now = new Date("2026-07-19T12:00:00Z");
    const row = buildConcertRow({ artist: "X", date: "2026-01-01" }, uid, now);
    expect(row.scanned_at).toBe("2026-07-19T12:00:00.000Z");
  });
});

describe("canonicalizeGenres", () => {
  it("matches case-insensitively and via aliases", () => {
    expect(canonicalizeGenres(["RIDDIM", "hip hop"])).toEqual([
      "Riddim",
      "Hip-Hop",
    ]);
  });
  it("caps at 3 and dedupes", () => {
    expect(
      canonicalizeGenres(["Techno", "techno", "House", "Trance", "EDM"]),
    ).toEqual(["Techno", "House", "Trance"]);
  });
  it("returns [] for junk input", () => {
    expect(canonicalizeGenres(null)).toEqual([]);
    expect(canonicalizeGenres(["", "  ", "Polka Metal Fusion Wave"])).toEqual(
      [],
    );
  });
});

describe("PARSE_SYSTEM prompt integrity", () => {
  it("contains the JSON contract and the genre list", () => {
    expect(PARSE_SYSTEM).toContain('"is_ticket"');
    expect(PARSE_SYSTEM).toContain("GENRE LIST");
    expect(PARSE_SYSTEM).toContain("end_date");
  });
  it("embeds every genre from the taxonomy", () => {
    expect(ALL_GENRES.length).toBeGreaterThan(300);
    for (const g of [...GENRE_PARENTS, "Riddim", "Corridos Tumbados"]) {
      expect(PARSE_SYSTEM).toContain(g);
    }
  });
  it("forward domain is production", () => {
    expect(FORWARD_DOMAIN).toBe("encorefriends.com");
  });
});
