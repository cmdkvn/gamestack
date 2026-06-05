import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { runSteamPageCheck } from "./check.ts";
import { renderMarkdown } from "./render.ts";

const SCRATCH_DIR = join(import.meta.dir, "__fixtures__", "scratch-steam");
const STEAM_DIR = join(SCRATCH_DIR, "marketing", "steam");

// Minimal valid PNG (1×1). Used as a buffer template — we mutate IHDR to set
// the dimensions we want each capsule to claim.
const TINY_PNG_1x1 = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x44, 0x41,
  0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
  0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82,
]);

function makePng(width: number, height: number): Uint8Array {
  const buf = new Uint8Array(TINY_PNG_1x1);
  const view = new DataView(buf.buffer);
  view.setUint32(16, width, false);
  view.setUint32(20, height, false);
  return buf;
}

beforeAll(() => {
  if (existsSync(SCRATCH_DIR)) rmSync(SCRATCH_DIR, { recursive: true, force: true });
  mkdirSync(STEAM_DIR, { recursive: true });

  // page.json with intentional issues to exercise the checks.
  const page = {
    appId: 12345,
    pageState: "coming-soon",
    shortDescription:
      "Embark on a journey across a vast world. Stunning visuals and an unforgettable journey. ✓ 100+ levels ✓ deep crafting ✓ stunning graphics.",
    longDescription: "—",
    tags: ["Indie", "Pixel Art", "Atmospheric"],
    trailerSeconds: 150,
    trailerHasSubtitles: false,
    trailerHasStudioCardAtStart: true,
    trailerFirstSixSecondVerb: false,
    screenshotsCount: 3,
    nextFest: {
      planned: true,
      demoMinutes: 75,
      demoEndsOnHook: false,
    },
  };
  writeFileSync(join(STEAM_DIR, "page.json"), JSON.stringify(page, null, 2));

  // Capsules: header correct, main wrong dimensions, library missing.
  writeFileSync(join(STEAM_DIR, "header-capsule.png"), makePng(460, 215));
  writeFileSync(join(STEAM_DIR, "main-capsule.png"), makePng(1000, 600));
  writeFileSync(join(STEAM_DIR, "small-capsule.png"), makePng(231, 87));
  writeFileSync(join(STEAM_DIR, "page-background.png"), makePng(1438, 810));
});

afterAll(() => {
  if (existsSync(SCRATCH_DIR)) rmSync(SCRATCH_DIR, { recursive: true, force: true });
});

describe("runSteamPageCheck", () => {
  test("PASS verdict on correctly-sized header capsule", () => {
    const r = runSteamPageCheck({ projectRoot: SCRATCH_DIR });
    const header = r.capsules.find((c) => c.slot === "header")!;
    expect(header.verdict).toBe("PASS");
    expect(header.actualWidth).toBe(460);
    expect(header.actualHeight).toBe(215);
  });

  test("FAIL verdict on wrong-sized main capsule", () => {
    const r = runSteamPageCheck({ projectRoot: SCRATCH_DIR });
    const main = r.capsules.find((c) => c.slot === "main")!;
    expect(main.verdict).toBe("FAIL");
    expect(main.reason).toContain("expected 1232×706");
  });

  test("MISSING verdict on absent library capsule slots", () => {
    const r = runSteamPageCheck({ projectRoot: SCRATCH_DIR });
    const libHero = r.capsules.find((c) => c.slot === "library-hero")!;
    expect(libHero.verdict).toBe("MISSING");
  });

  test("trailer outside sweet spot is flagged", () => {
    const r = runSteamPageCheck({ projectRoot: SCRATCH_DIR });
    expect(r.trailer.lengthSec).toBe(150);
    expect(r.trailer.withinSweetSpot).toBe(false);
    expect(r.trailer.reasons.some((s) => s.includes("hard max"))).toBe(true);
    expect(r.trailer.reasons.some((s) => s.includes("first 6 seconds"))).toBe(true);
    expect(r.trailer.reasons.some((s) => s.includes("studio card"))).toBe(true);
  });

  test("short description cliché + feature-list + missing genre word flagged", () => {
    const r = runSteamPageCheck({ projectRoot: SCRATCH_DIR });
    const sd = r.shortDescription!;
    expect(sd.clicheFlags.length).toBeGreaterThan(0);
    expect(sd.featureListFlag).toBe(true);
    // The fixture description doesn't name a genre tag (no "Indie", "Roguelike" etc. as words).
    expect(sd.genreWordPresent).toBe(false);
  });

  test("tags within recommended count range", () => {
    const r = runSteamPageCheck({ projectRoot: SCRATCH_DIR });
    expect(r.tags!.count).toBe(3);
    expect(r.tags!.withinRange).toBe(false);
    expect(r.tags!.recommendedAdditions.length).toBeGreaterThan(0);
  });

  test("screenshots under minimum surfaced", () => {
    const r = runSteamPageCheck({ projectRoot: SCRATCH_DIR });
    expect(r.screenshots.count).toBe(3);
    expect(r.screenshots.withinMinimum).toBe(false);
  });

  test("Next Fest demo too long flagged", () => {
    const r = runSteamPageCheck({ projectRoot: SCRATCH_DIR });
    expect(r.nextFest!.planned).toBe(true);
    expect(r.nextFest!.demoLengthOk).toBe(false);
    expect(r.nextFest!.demoEndsOnHook).toBe(false);
  });

  test("wishlist risk is HIGH on this fixture", () => {
    const r = runSteamPageCheck({ projectRoot: SCRATCH_DIR });
    expect(r.wishlistRisk).toBe("HIGH");
  });

  test("topEdits sorted by impact, capped at 5", () => {
    const r = runSteamPageCheck({ projectRoot: SCRATCH_DIR });
    expect(r.topEdits.length).toBeLessThanOrEqual(5);
    expect(r.topEdits.length).toBeGreaterThan(0);
    // First edit should mention the trailer verb (impact 95) or capsule (impact 100).
    expect(r.topEdits[0]!.edit.length).toBeGreaterThan(0);
  });

  test("renderMarkdown produces a non-empty report", () => {
    const r = runSteamPageCheck({ projectRoot: SCRATCH_DIR });
    const md = renderMarkdown(r);
    expect(md).toContain("# Steam page check");
    expect(md).toContain("Wishlist-conversion risk: HIGH");
  });

  test("steam dir not found surfaces MISSING for every capsule slot", () => {
    const empty = join(import.meta.dir, "__fixtures__", "empty-project");
    if (existsSync(empty)) rmSync(empty, { recursive: true, force: true });
    mkdirSync(empty, { recursive: true });
    try {
      const r = runSteamPageCheck({ projectRoot: empty });
      expect(r.capsules.every((c) => c.verdict === "MISSING")).toBe(true);
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
  });
});
