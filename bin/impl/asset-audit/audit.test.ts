import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, writeFileSync, rmSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { runAssetAudit } from "./audit.ts";
import { renderMarkdown } from "./render.ts";
import { resolvePlatform } from "../shared/platforms.ts";

const FIXTURE_DIR = join(import.meta.dir, "__fixtures__", "unity-mini");
const SCRATCH_DIR = join(import.meta.dir, "__fixtures__", "scratch-unity");

// Minimal valid PNG (1×1 transparent).
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

// Synthesize an "oversized" PNG by setting IHDR width/height to a huge value
// in a custom buffer. The image-size lib reads IHDR bytes — actual pixel data
// doesn't need to match for the dimension read.
function makePngWithDimensions(width: number, height: number): Uint8Array {
  const buf = new Uint8Array(TINY_PNG_1x1);
  // IHDR width = bytes 16..19 (big-endian uint32)
  const view = new DataView(buf.buffer);
  view.setUint32(16, width, false);
  view.setUint32(20, height, false);
  return buf;
}

beforeAll(() => {
  // Build a fresh scratch fixture that exercises the texture-dimension warning,
  // the .meta integrity check, and the .gitignore meta-exclusion catastrophe.
  if (existsSync(SCRATCH_DIR)) rmSync(SCRATCH_DIR, { recursive: true, force: true });
  mkdirSync(join(SCRATCH_DIR, "ProjectSettings"), { recursive: true });
  mkdirSync(join(SCRATCH_DIR, "Assets", "textures"), { recursive: true });
  writeFileSync(join(SCRATCH_DIR, "ProjectSettings", "ProjectSettings.asset"), "marker");

  // .gitignore that catastrophically excludes .meta files — should produce P0.
  writeFileSync(join(SCRATCH_DIR, ".gitignore"), "node_modules/\n*.meta\n");

  // Valid tiny PNG with sibling .meta — fine.
  writeFileSync(join(SCRATCH_DIR, "Assets", "textures", "ok.png"), TINY_PNG_1x1);
  writeFileSync(join(SCRATCH_DIR, "Assets", "textures", "ok.png.meta"), "guid: deadbeef\n");

  // Oversized PNG (10000×10000) — triggers texture-max violation on every platform.
  writeFileSync(join(SCRATCH_DIR, "Assets", "textures", "huge.png"), makePngWithDimensions(10_000, 10_000));
  writeFileSync(join(SCRATCH_DIR, "Assets", "textures", "huge.png.meta"), "guid: cafebabe\n");

  // Orphan without .meta — should produce P0 critical finding.
  writeFileSync(join(SCRATCH_DIR, "Assets", "textures", "orphan.png"), TINY_PNG_1x1);

  // WAV — should produce P1 audio finding.
  mkdirSync(join(SCRATCH_DIR, "Assets", "audio"), { recursive: true });
  writeFileSync(join(SCRATCH_DIR, "Assets", "audio", "sfx.wav"), "RIFF" + "x".repeat(2048));
});

afterAll(() => {
  if (existsSync(SCRATCH_DIR)) rmSync(SCRATCH_DIR, { recursive: true, force: true });
});

describe("runAssetAudit", () => {
  test("detects Unity engine via ProjectSettings marker", () => {
    const platform = resolvePlatform("pc-mid")!;
    const report = runAssetAudit({
      projectRoot: SCRATCH_DIR,
      platformKey: platform.key,
      budget: platform.budget,
    });
    expect(report.engine).toBe("unity");
  });

  test("flags texture dimension above platform budget", () => {
    const platform = resolvePlatform("switch-handheld")!; // 1024 max
    const report = runAssetAudit({
      projectRoot: SCRATCH_DIR,
      platformKey: platform.key,
      budget: platform.budget,
    });
    const violations = report.findings.filter(
      (f) => f.category === "texture" && f.relPath.endsWith("huge.png") && f.severity === "P1",
    );
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0]!.detail).toContain("10000×10000");
  });

  test("flags WAV files as uncompressed audio", () => {
    const platform = resolvePlatform("pc-mid")!;
    const report = runAssetAudit({
      projectRoot: SCRATCH_DIR,
      platformKey: platform.key,
      budget: platform.budget,
    });
    const wavFindings = report.findings.filter((f) => f.relPath.endsWith(".wav") && f.category === "audio");
    expect(wavFindings.length).toBeGreaterThan(0);
    expect(wavFindings[0]!.severity).toBe("P1");
  });

  test("emits P0 critical when .gitignore excludes .meta files", () => {
    const platform = resolvePlatform("pc-mid")!;
    const report = runAssetAudit({
      projectRoot: SCRATCH_DIR,
      platformKey: platform.key,
      budget: platform.budget,
    });
    const meta = report.findings.find((f) => f.category === "critical" && f.relPath === ".gitignore");
    expect(meta).toBeDefined();
    expect(meta!.severity).toBe("P0");
  });

  test("emits P0 critical for Unity asset missing its .meta sibling", () => {
    const platform = resolvePlatform("pc-mid")!;
    const report = runAssetAudit({
      projectRoot: SCRATCH_DIR,
      platformKey: platform.key,
      budget: platform.budget,
    });
    const orphan = report.findings.find((f) => f.category === "critical" && f.relPath.endsWith("orphan.png"));
    expect(orphan).toBeDefined();
    expect(orphan!.severity).toBe("P0");
  });

  test("excludes Assets/Editor by engine convention", () => {
    const platform = resolvePlatform("pc-mid")!;
    const report = runAssetAudit({
      projectRoot: FIXTURE_DIR,
      platformKey: platform.key,
      budget: platform.budget,
    });
    const editorFiles = report.findings.filter((f) => f.relPath.includes("Editor/"));
    expect(editorFiles.length).toBe(0);
  });

  test("renderMarkdown produces a non-empty markdown report", () => {
    const platform = resolvePlatform("pc-mid")!;
    const report = runAssetAudit({
      projectRoot: SCRATCH_DIR,
      platformKey: platform.key,
      budget: platform.budget,
    });
    const md = renderMarkdown(report);
    expect(md).toContain("# Asset audit");
    expect(md).toContain(report.platform);
    expect(md.length).toBeGreaterThan(200);
  });

  test("strict mode threshold logic: at least one P1 finding present in scratch fixture", () => {
    const platform = resolvePlatform("pc-mid")!;
    const report = runAssetAudit({
      projectRoot: SCRATCH_DIR,
      platformKey: platform.key,
      budget: platform.budget,
    });
    const p1OrAbove = report.findings.filter((f) => f.severity === "P0" || f.severity === "P1");
    expect(p1OrAbove.length).toBeGreaterThan(0);
  });
});
