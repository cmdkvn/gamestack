import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  applyDecay,
  computeSignals,
  emptyProfile,
  loadProfile,
  readEvents,
  recordEvents,
  saveProfile,
  type ApprovalEvent,
  type TasteProfile,
} from "./profile.ts";
import { renderMarkdown } from "./render.ts";

const SCRATCH = join(import.meta.dir, "__fixtures__", "scratch");
const PROFILE = join(SCRATCH, ".gamestack", "taste.json");

beforeAll(() => {
  if (existsSync(SCRATCH)) rmSync(SCRATCH, { recursive: true, force: true });
  mkdirSync(SCRATCH, { recursive: true });
});

afterAll(() => {
  if (existsSync(SCRATCH)) rmSync(SCRATCH, { recursive: true, force: true });
});

function lightingEvent(value: string, outcome: ApprovalEvent["outcome"]): ApprovalEvent {
  return {
    subject: "key art",
    variant: "V" + Math.floor(Math.random() * 10),
    axisVaried: "lighting",
    axisValue: value,
    outcome,
  };
}

describe("taste profile", () => {
  test("empty profile loads cleanly when file missing", () => {
    const p = loadProfile(PROFILE);
    expect(p.version).toBe(1);
    expect(p.rounds.length).toBe(0);
    expect(p.preferences.byAxis).toEqual({});
  });

  test("record events updates axis stats", () => {
    let p = emptyProfile();
    p = recordEvents(p, [
      lightingEvent("backlit", "KEEP"),
      lightingEvent("backlit", "KEEP"),
      lightingEvent("direct", "DISCARD"),
    ]);
    expect(p.preferences.byAxis["lighting"]!["backlit"]!.wins).toBe(2);
    expect(p.preferences.byAxis["lighting"]!["direct"]!.losses).toBe(1);
  });

  test("MIX_IN counts as half a win", () => {
    let p = emptyProfile();
    p = recordEvents(p, [lightingEvent("rim", "MIX_IN")]);
    expect(p.preferences.byAxis["lighting"]!["rim"]!.wins).toBe(0.5);
  });

  test("emerging signal threshold requires ≥4 total samples and ≥70% win rate", () => {
    let p = emptyProfile();
    p = recordEvents(p, [
      lightingEvent("backlit", "KEEP"),
      lightingEvent("backlit", "KEEP"),
      lightingEvent("backlit", "KEEP"),
    ]);
    expect(computeSignals(p).length).toBe(0); // only 3 samples → below threshold

    p = recordEvents(p, [lightingEvent("backlit", "KEEP"), lightingEvent("direct", "DISCARD")]);
    const signals = computeSignals(p);
    expect(signals.length).toBeGreaterThan(0);
    expect(signals[0]).toContain("backlit");
  });

  test("round logs accumulate; same subject+date collapses into one round", () => {
    let p = emptyProfile();
    const e1: ApprovalEvent = { ...lightingEvent("backlit", "KEEP"), date: "2026-06-01" };
    const e2: ApprovalEvent = { ...lightingEvent("direct", "DISCARD"), date: "2026-06-01" };
    p = recordEvents(p, [e1, e2]);
    expect(p.rounds.length).toBe(1);
    expect(p.rounds[0]!.variants.length).toBe(2);
  });

  test("save and reload round-trips", () => {
    let p = emptyProfile();
    p = recordEvents(p, [lightingEvent("backlit", "KEEP")]);
    saveProfile(PROFILE, p);
    expect(existsSync(PROFILE)).toBe(true);
    const reloaded = loadProfile(PROFILE);
    expect(reloaded.preferences.byAxis["lighting"]!["backlit"]!.wins).toBe(1);
  });

  test("decay shrinks old wins/losses; recent activity preserved", () => {
    let p = emptyProfile();
    p = recordEvents(p, [
      lightingEvent("backlit", "KEEP"),
      lightingEvent("backlit", "KEEP"),
      lightingEvent("backlit", "KEEP"),
      lightingEvent("backlit", "KEEP"),
    ]);
    // Force lastUpdated to 90 days ago.
    const oldDate = new Date(Date.now() - 90 * 86_400_000).toISOString();
    p.preferences.byAxis["lighting"]!["backlit"]!.lastUpdated = oldDate;

    const decayed = applyDecay(p, { halfLifeDays: 90 });
    const stat = decayed.preferences.byAxis["lighting"]!["backlit"]!;
    // 90 days → factor 0.5 → wins should be ~2.
    expect(stat.wins).toBeGreaterThan(1.9);
    expect(stat.wins).toBeLessThan(2.1);
  });

  test("readEvents parses single object, array, and NDJSON", () => {
    const single = JSON.stringify(lightingEvent("backlit", "KEEP"));
    const array = JSON.stringify([lightingEvent("rim", "KEEP"), lightingEvent("direct", "DISCARD")]);
    const ndjson = [
      JSON.stringify(lightingEvent("rim", "MIX_IN")),
      JSON.stringify(lightingEvent("direct", "DISCARD")),
    ].join("\n");

    const singlePath = join(SCRATCH, "single.json");
    const arrayPath = join(SCRATCH, "array.json");
    const ndjsonPath = join(SCRATCH, "events.ndjson");
    writeFileSync(singlePath, single);
    writeFileSync(arrayPath, array);
    writeFileSync(ndjsonPath, ndjson);

    expect(readEvents(singlePath).length).toBe(1);
    expect(readEvents(arrayPath).length).toBe(2);
    expect(readEvents(ndjsonPath).length).toBe(2);
  });

  test("readEvents rejects events with missing required fields", () => {
    const path = join(SCRATCH, "bad.json");
    writeFileSync(path, JSON.stringify({ subject: "x" }));
    expect(() => readEvents(path)).toThrow();
  });

  test("readEvents rejects unknown outcome", () => {
    const path = join(SCRATCH, "bad-outcome.json");
    writeFileSync(
      path,
      JSON.stringify({ subject: "x", variant: "V1", axisVaried: "lighting", axisValue: "warm", outcome: "MAYBE" }),
    );
    expect(() => readEvents(path)).toThrow();
  });

  test("renderMarkdown emits non-empty markdown with emerging signals when present", () => {
    let p = emptyProfile();
    p = recordEvents(p, [
      lightingEvent("backlit", "KEEP"),
      lightingEvent("backlit", "KEEP"),
      lightingEvent("backlit", "KEEP"),
      lightingEvent("backlit", "KEEP"),
      lightingEvent("direct", "DISCARD"),
    ]);
    const md = renderMarkdown(p);
    expect(md).toContain("# Taste profile");
    expect(md).toContain("Emerging signals");
    expect(md).toContain("backlit");
  });
});
