// Guards against the "blank screen" class of bug: a React hook (useState/
// useEffect/useRef/useMemo/useCallback) declared AFTER the App component's
// early auth return. When that happens the hook count changes between the
// splash render and the full render, React throws "rendered more hooks than
// during the previous render", and /app goes blank. esbuild can't catch this
// (it's a runtime rule), so we catch it statically here.
//
// Run: npm test
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// App() lives in the last app module after the js/app.js split.
const appPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "js",
  "app",
  "09-main.js",
);
const lines = readFileSync(appPath, "utf8").split("\n");

// The early return inside App(): the `if (authLoading ...)` guard whose
// `return (` sits on the next line. Match the guard line itself.
const earlyReturnIdx = lines.findIndex((l) =>
  /^\s*if \(authLoading\b/.test(l),
);

const HOOK = /^\s*(?:const \[[^\]]+\]\s*=\s*)?(useState|useEffect|useRef|useMemo|useCallback)\s*\(/;

describe("App hooks are all above the early auth return", () => {
  it("finds the early auth return in app.js", () => {
    expect(earlyReturnIdx).toBeGreaterThan(0);
  });

  it("has no hook declared after the early return (blank-screen guard)", () => {
    // Only scan the App component body: from the early return to the next
    // top-level `function ` declaration (App is the last big component).
    const offenders = [];
    for (let i = earlyReturnIdx + 1; i < lines.length; i++) {
      if (/^function /.test(lines[i])) break; // left App()
      if (HOOK.test(lines[i]))
        offenders.push(i + 1 + ": " + lines[i].trim());
    }
    expect(
      offenders,
      "Move these hooks ABOVE the `if (authLoading...) return` in App():\n" +
        offenders.join("\n"),
    ).toEqual([]);
  });
});
