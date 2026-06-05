import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, writeFileSync, rmSync, existsSync, utimesSync } from "node:fs";
import { join } from "node:path";
import { runCertCheck } from "./check.ts";
import { renderMarkdown } from "./render.ts";

const FIXTURE_DIR = join(import.meta.dir, "__fixtures__", "unity-cert-ready");
const SCRATCH_DIR = join(import.meta.dir, "__fixtures__", "scratch-empty");

beforeAll(() => {
  if (existsSync(SCRATCH_DIR)) rmSync(SCRATCH_DIR, { recursive: true, force: true });
  mkdirSync(join(SCRATCH_DIR, "ProjectSettings"), { recursive: true });
  mkdirSync(join(SCRATCH_DIR, "Assets", "Scripts"), { recursive: true });
  writeFileSync(join(SCRATCH_DIR, "ProjectSettings", "ProjectSettings.asset"), "marker");
  writeFileSync(join(SCRATCH_DIR, "Assets", "Scripts", "Empty.cs"), "public class Empty {}\n");
});

afterAll(() => {
  if (existsSync(SCRATCH_DIR)) rmSync(SCRATCH_DIR, { recursive: true, force: true });
});

describe("runCertCheck", () => {
  test("PS5: code-only PASS for categories with matching patterns", () => {
    const report = runCertCheck({ projectRoot: FIXTURE_DIR, platforms: ["ps5"] });
    const ps5 = report.platforms[0]!;
    const saveResult = ps5.results.find((r) => r.category.id === "save-integrity")!;
    expect(saveResult.verdict).toBe("PASS_CODE_ONLY");
    expect(saveResult.evidence.codeMatches.length).toBeGreaterThan(0);

    const sleepResult = ps5.results.find((r) => r.category.id === "sleep-resume")!;
    expect(sleepResult.verdict).toBe("PASS_CODE_ONLY");
  });

  test("PS5: detects checklist version on file", () => {
    const report = runCertCheck({ projectRoot: FIXTURE_DIR, platforms: ["ps5"] });
    expect(report.platforms[0]!.checklistVersionOnFile).toBe("ps5-trc-v9.2.md");
  });

  test("PS5 on empty project: missing checklist surfaces P0 in action list", () => {
    const report = runCertCheck({ projectRoot: SCRATCH_DIR, platforms: ["ps5"] });
    expect(report.platforms[0]!.checklistVersionOnFile).toBeNull();
    const p0 = report.actionList.p0;
    expect(p0.some((a) => a.category === "checklist-version")).toBe(true);
  });

  test("Xbox: accessibility FAIL_P0 when no subtitle/remap code present", () => {
    const report = runCertCheck({ projectRoot: SCRATCH_DIR, platforms: ["xbox"] });
    const xbox = report.platforms[0]!;
    const a11y = xbox.results.find((r) => r.category.id === "accessibility")!;
    expect(a11y.verdict).toBe("FAIL_P0");
  });

  test("Xbox: accessibility PASS_CODE_ONLY when subtitle + remap code present", () => {
    const report = runCertCheck({ projectRoot: FIXTURE_DIR, platforms: ["xbox"] });
    const xbox = report.platforms[0]!;
    const a11y = xbox.results.find((r) => r.category.id === "accessibility")!;
    expect(a11y.verdict).toBe("PASS_CODE_ONLY");
  });

  test("Switch: sleep-resume FAIL_P0 on empty project", () => {
    const report = runCertCheck({ projectRoot: SCRATCH_DIR, platforms: ["switch"] });
    const sw = report.platforms[0]!;
    const sleep = sw.results.find((r) => r.category.id === "sleep-resume")!;
    expect(sleep.verdict).toBe("FAIL_P0");
  });

  test("multi-platform: 'all' returns three platforms", () => {
    const report = runCertCheck({ projectRoot: FIXTURE_DIR, platforms: ["ps5", "xbox", "switch"] });
    expect(report.platforms.map((p) => p.platform)).toEqual(["ps5", "xbox", "switch"]);
  });

  test("submission readiness BLOCKED when any FAIL_P0 present", () => {
    const report = runCertCheck({ projectRoot: SCRATCH_DIR, platforms: ["switch"] });
    expect(report.platforms[0]!.submissionReadiness).toBe("BLOCKED");
  });

  test("renderMarkdown produces a non-empty report with the reminder", () => {
    const report = runCertCheck({ projectRoot: FIXTURE_DIR, platforms: ["ps5"] });
    const md = renderMarkdown(report);
    expect(md).toContain("# Cert readiness");
    expect(md).toContain("NDA-protected");
    expect(md).toContain("PS5");
  });

  test("playtest run within 30 days promotes scenario-backed category to PASS", () => {
    const playtestRunDir = join(SCRATCH_DIR, "playtest", "playtest-20260603");
    mkdirSync(playtestRunDir, { recursive: true });
    writeFileSync(join(playtestRunDir, "manifest.json"), JSON.stringify({ scenario: "05-cert-save-fuzz.json" }));
    // Also need atomic save evidence so the playtest pass actually elevates the verdict.
    writeFileSync(
      join(SCRATCH_DIR, "Assets", "Scripts", "AtomicSave.cs"),
      "using System.IO;\npublic static class S { public static void Save(string p, byte[] b) { File.WriteAllBytes(p+\".tmp\", b); File.Replace(p+\".tmp\", p, null); } }\n",
    );
    const report = runCertCheck({ projectRoot: SCRATCH_DIR, platforms: ["ps5"] });
    const save = report.platforms[0]!.results.find((r) => r.category.id === "save-integrity")!;
    expect(save.verdict).toBe("PASS");
    rmSync(join(SCRATCH_DIR, "playtest"), { recursive: true, force: true });
    rmSync(join(SCRATCH_DIR, "Assets", "Scripts", "AtomicSave.cs"));
  });
});
