// Unit tests for the event-page parser (no network).
// Run: npm test
import { describe, it, expect } from "vitest";
import { parseEventPage, toISODate } from "../netlify/functions/event-scrape.mjs";

describe("toISODate", () => {
  it("passes ISO dates and datetimes through", () => {
    expect(toISODate("2026-11-07")).toBe("2026-11-07");
    expect(toISODate("2026-07-18T22:00:00-04:00")).toBe("2026-07-18");
  });
  it("parses 'Month D, YYYY' (with/without ordinal)", () => {
    expect(toISODate("November 7, 2026")).toBe("2026-11-07");
    expect(toISODate("Nov 7th, 2026")).toBe("2026-11-07");
  });
  it("parses 'D Month YYYY'", () => {
    expect(toISODate("7 November 2026")).toBe("2026-11-07");
    expect(toISODate("7 Nov 2026")).toBe("2026-11-07");
  });
  it("returns '' for junk", () => {
    expect(toISODate("")).toBe("");
    expect(toISODate("sometime next fall")).toBe("");
  });
});

describe("parseEventPage — Open Graph fallback (real Shotgun tags)", () => {
  const html = `
    <meta name="description" content="Tickets for Mad-Netic: Make A Dance, Alex Mccracken, Victor Florescu in New York, United States – November 7, 2026"/>
    <meta property="og:title" content="Mad-Netic: Make A Dance, Alex Mccracken, Victor Florescu, Brooklyn · Shotgun Tickets"/>
    <meta property="og:description" content="Tickets for Mad-Netic: Make A Dance, Alex Mccracken, Victor Florescu in New York, United States – November 7, 2026"/>`;
  const info = parseEventPage(html);
  it("reads the event date from the description", () => {
    expect(info.date).toBe("2026-11-07");
  });
  it("reads the city", () => {
    expect(info.city).toBe("New York");
  });
  it("reads the title and strips the site suffix", () => {
    expect(info.title).toBe(
      "Mad-Netic: Make A Dance, Alex Mccracken, Victor Florescu, Brooklyn",
    );
  });
});

describe("parseEventPage — schema.org JSON-LD", () => {
  const html = `<script type="application/ld+json">
    {"@context":"https://schema.org","@type":"MusicEvent",
     "name":"Peggy Gou at The Brooklyn Mirage",
     "startDate":"2026-07-18T22:00:00-04:00",
     "location":{"@type":"Place","name":"The Brooklyn Mirage",
       "address":{"@type":"PostalAddress","addressLocality":"Brooklyn","addressRegion":"NY"}}}
    </script>`;
  const info = parseEventPage(html);
  it("prefers JSON-LD for all fields", () => {
    expect(info.title).toBe("Peggy Gou at The Brooklyn Mirage");
    expect(info.date).toBe("2026-07-18");
    expect(info.venue).toBe("The Brooklyn Mirage");
    expect(info.city).toBe("Brooklyn, NY");
  });
});

describe("parseEventPage — robustness", () => {
  it("decodes HTML entities in og fields", () => {
    const html = `<meta property="og:title" content="Rufus Du Sol &amp; Friends | Tickets"/>`;
    expect(parseEventPage(html).title).toBe("Rufus Du Sol & Friends");
  });
  it("returns empty fields when nothing is parseable", () => {
    const info = parseEventPage("<html><body>no event here</body></html>");
    expect(info).toEqual({ title: "", date: "", city: "", venue: "" });
  });
});
