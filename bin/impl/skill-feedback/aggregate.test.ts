import { describe, expect, test } from "bun:test";
import { aggregate, type FeedbackEntry } from "./aggregate.ts";

function entry(partial: Partial<FeedbackEntry> & { skill: string; verdict: string; at: string }): FeedbackEntry {
  return partial as FeedbackEntry;
}

describe("aggregate", () => {
  test("empty input → no skills", () => {
    const a = aggregate([]);
    expect(a.skills).toHaveLength(0);
    expect(a.total_entries).toBe(0);
  });

  test("groups by skill and counts verdicts", () => {
    const entries: FeedbackEntry[] = [
      entry({ skill: "critique", verdict: "useful", at: "2026-06-05T10:00:00Z" }),
      entry({ skill: "critique", verdict: "useful", at: "2026-06-05T11:00:00Z" }),
      entry({ skill: "critique", verdict: "not-useful", at: "2026-06-05T12:00:00Z", reason: "wrong engine" }),
      entry({ skill: "design-jam", verdict: "useful", at: "2026-06-05T13:00:00Z" }),
    ];
    const a = aggregate(entries);
    expect(a.skills).toHaveLength(2);
    const c = a.skills.find((s) => s.skill === "critique")!;
    expect(c.total).toBe(3);
    expect(c.useful).toBe(2);
    expect(c.not_useful).toBe(1);
    expect(c.useful_rate).toBeCloseTo(2 / 3);
  });

  test("top reasons surface only from not-useful entries", () => {
    const entries: FeedbackEntry[] = [
      entry({ skill: "critique", verdict: "useful", at: "2026-06-05T10:00:00Z", reason: "great" }),
      entry({ skill: "critique", verdict: "not-useful", at: "2026-06-05T11:00:00Z", reason: "wrong engine" }),
      entry({ skill: "critique", verdict: "not-useful", at: "2026-06-05T12:00:00Z", reason: "wrong engine" }),
      entry({ skill: "critique", verdict: "not-useful", at: "2026-06-05T13:00:00Z", reason: "too long" }),
    ];
    const a = aggregate(entries);
    const c = a.skills[0]!;
    expect(c.top_reasons[0]).toEqual({ reason: "wrong engine", count: 2 });
    expect(c.top_reasons[1]).toEqual({ reason: "too long", count: 1 });
    expect(c.top_reasons.some((r) => r.reason === "great")).toBe(false);
  });

  test("tags are counted across all verdicts", () => {
    const entries: FeedbackEntry[] = [
      entry({ skill: "x", verdict: "useful", at: "2026-06-05T10:00:00Z", tags: ["a", "b"] }),
      entry({ skill: "x", verdict: "not-useful", at: "2026-06-05T11:00:00Z", tags: ["a"] }),
    ];
    const a = aggregate(entries);
    const x = a.skills[0]!;
    expect(x.top_tags[0]).toEqual({ tag: "a", count: 2 });
    expect(x.top_tags[1]).toEqual({ tag: "b", count: 1 });
  });

  test("sorting puts higher-volume skills first, then lower useful-rate", () => {
    const entries: FeedbackEntry[] = [
      // 3 useful + 1 not-useful = 75% useful, 4 entries
      entry({ skill: "high-vol", verdict: "useful", at: "2026-06-05T10:00:00Z" }),
      entry({ skill: "high-vol", verdict: "useful", at: "2026-06-05T10:00:00Z" }),
      entry({ skill: "high-vol", verdict: "useful", at: "2026-06-05T10:00:00Z" }),
      entry({ skill: "high-vol", verdict: "not-useful", at: "2026-06-05T10:00:00Z" }),
      // 0 useful + 2 not-useful = 0% useful, 2 entries
      entry({ skill: "low-vol-bad", verdict: "not-useful", at: "2026-06-05T10:00:00Z" }),
      entry({ skill: "low-vol-bad", verdict: "not-useful", at: "2026-06-05T10:00:00Z" }),
    ];
    const a = aggregate(entries);
    expect(a.skills[0]!.skill).toBe("high-vol");
    expect(a.skills[1]!.skill).toBe("low-vol-bad");
  });
});
