// Render smoke tests — actually mount leaf UI components with react-dom/server
// so we catch the class of bug where a value that's an OBJECT is rendered as a
// React child (e.g. fmt() returns {mo,day,dow,full}; rendering it raw throws
// React error #31 and blanks the whole app). The browser build has no compile
// step, so ONLY an actual render surfaces this — unit tests and Babel transforms
// won't. Add a case here whenever a new page/leaf component ships.
//
// Run: npm test
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as Babel from "@babel/standalone";
import React from "react";
import { renderToString } from "react-dom/server";

const appDir = join(dirname(fileURLToPath(import.meta.url)), "..", "js", "app");

// Compile a set of app modules the same way Babel Standalone does in app.html
// (classic runtime → React.createElement, one shared scope), then return one
// component by name. `preamble` supplies the globals those modules expect from
// earlier-loaded files we don't need here (React hooks, MONTHS, navigator).
function loadComponent(files, name) {
  const preamble = `
    const { useState, useEffect, useRef, useMemo, useCallback } = React;
    const navigator = { share: null, clipboard: null };
    const MONTHS = ["January","February","March","April","May","June",
      "July","August","September","October","November","December"];
  `;
  const src = files.map((f) => readFileSync(join(appDir, f), "utf8")).join("\n");
  const { code } = Babel.transform(preamble + "\n" + src, {
    presets: [["react", { runtime: "classic" }]],
  });
  return new Function("React", `${code}\n; return ${name};`)(React);
}

const TourPage = loadComponent(
  ["02-genres.js", "03-helpers.js", "06b-tour.js"],
  "TourPage",
);

const baseUser = {
  id: "u1",
  bucketList: ["Four Tet"],
  following: ["u2"],
  artists: [],
  genres: ["Techno"],
};
const users = [
  { id: "u2", name: "Sam", color: "#fff", artists: [], genres: ["Techno"], following: [] },
];
const noop = () => {};

describe("TourPage renders without throwing", () => {
  it("renders a populated tour (exercises fmt() on next + first show)", () => {
    // Fixed far-past + far-future dates so there's always a past AND an upcoming
    // show regardless of when the test runs. The upcoming show has no venue/city
    // so the 'Next up' line falls through to fmt().full — the exact crash path.
    const concerts = [
      { artist: "Charlotte de Witte", city: "Brooklyn, NY", venue: "Mirage", date: "2020-05-01", is_festival: false, genres: ["Peak Time Techno"], attendees: ["u1", "u2"] },
      { artist: "Four Tet", city: "", venue: "", date: "2999-09-01", is_festival: false, genres: ["Tech House"], attendees: ["u1"] },
    ];
    const html = renderToString(
      React.createElement(TourPage, {
        user: baseUser, concerts, users,
        onBack: noop, onArtistClick: noop, onGenreClick: noop, onViewProfile: noop,
      }),
    );
    expect(html).toContain("On tour since");
    // A real month name proves fmt() rendered its string, not the raw object.
    expect(html).toMatch(/January|February|March|April|May|June|July|August|September|October|November|December/);
    expect(html).not.toContain("[object Object]");
  });

  it("renders the empty state for a user with no shows", () => {
    const html = renderToString(
      React.createElement(TourPage, {
        user: { ...baseUser, bucketList: [] }, concerts: [], users: [],
        onBack: noop, onArtistClick: noop, onGenreClick: noop, onViewProfile: noop,
      }),
    );
    expect(html).toContain("Your tour starts here");
  });
});

const CCard = loadComponent(
  ["02-genres.js", "03-helpers.js", "04-cards.js"],
  "CCard",
);

describe("CCard (ticket stub) renders without throwing", () => {
  const curUser = { id: "u1", following: [] };
  it("renders a future show — stars, source, countdown, friends cluster", () => {
    const c = {
      id: "c1", owner_id: "u9", artist: "Bicep", venue: "Fabric", city: "London",
      date: "2999-01-15", source: "Ticketmaster", attendees: ["u2"], genres: ["Techno"],
    };
    const html = renderToString(
      React.createElement(CCard, {
        c, users, curUser, onOpen: noop, onViewProfile: noop, onDelete: noop,
      }),
    );
    expect(html).toContain("Bicep");
    expect(html).toContain("★");
    expect(html).toContain("Days");            // urgency countdown label
    expect(html).toContain("Via Ticketmaster"); // purchase-source line
    expect(html).not.toContain("[object Object]");
  });
  it("renders a past show without throwing (agoLabel path)", () => {
    const c = { id: "c2", owner_id: "u9", artist: "Aphex Twin", venue: "Warehouse", city: "", date: "2020-01-01", attendees: [] };
    const html = renderToString(
      React.createElement(CCard, { c, users, curUser, onOpen: noop, onViewProfile: noop, onDelete: noop }),
    );
    expect(html).toContain("Aphex Twin");
    expect(html).not.toContain("[object Object]");
  });
});
