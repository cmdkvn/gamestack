import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, basename, dirname, relative } from "node:path";
import imageSize from "image-size";
import {
  type Engine,
  assetExcludeDirs,
  assetRoots,
  detectEngine,
} from "../shared/engine.ts";
import { walk, type WalkedFile } from "../shared/fs-walk.ts";
import { type PlatformBudget } from "../shared/platforms.ts";
import { formatBytes, isoDate } from "../shared/format.ts";

const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".tga", ".tif", ".tiff", ".webp", ".bmp", ".gif"]);
const AUDIO_EXTS = new Set([".wav", ".mp3", ".ogg", ".oga", ".aiff", ".flac", ".m4a", ".opus"]);
const MESH_EXTS = new Set([".fbx", ".glb", ".gltf", ".obj", ".dae", ".blend", ".max", ".3ds"]);
const SOURCE_ARTWORK_EXTS = new Set([".psd", ".aseprite", ".ase", ".pdn", ".kra"]);
const ATLAS_HINTS = ["atlas", "spritesheet", "spriteatlas"];

export type Severity = "P0" | "P1" | "P2" | "INFO";

export interface AssetFinding {
  severity: Severity;
  category: "texture" | "audio" | "mesh" | "atlas" | "naming" | "critical" | "summary";
  relPath: string;
  detail: string;
  proposal: string;
  sizeBytes?: number;
  width?: number;
  height?: number;
}

export interface AssetAuditReport {
  generatedAt: string;
  platform: string;
  budget: PlatformBudget;
  scanRoots: string[];
  engine: Engine;
  projectRoot: string;
  counts: {
    files: number;
    textures: number;
    audio: number;
    meshes: number;
    sourceArtwork: number;
  };
  totals: {
    bytes: number;
    textureBytes: number;
    audioBytes: number;
    meshBytes: number;
    sourceArtworkBytes: number;
  };
  findings: AssetFinding[];
  proposedActions: { rank: number; action: string; estSavingsBytes?: number }[];
  underBudget: boolean;
}

export interface AuditInput {
  projectRoot: string;
  platformKey: string;
  budget: PlatformBudget;
  engineHint?: Engine;
}

export function runAssetAudit(input: AuditInput): AssetAuditReport {
  const engine = input.engineHint ?? detectEngine(input.projectRoot);
  const roots = assetRoots(input.projectRoot, engine).filter((r) => existsSync(r));
  const excludes = assetExcludeDirs(engine);

  const allFiles: WalkedFile[] = [];
  for (const root of roots) {
    allFiles.push(...walk(root, { excludeDirNames: excludes }));
  }

  const findings: AssetFinding[] = [];
  const counts = { files: allFiles.length, textures: 0, audio: 0, meshes: 0, sourceArtwork: 0 };
  const totals = { bytes: 0, textureBytes: 0, audioBytes: 0, meshBytes: 0, sourceArtworkBytes: 0 };

  for (const file of allFiles) {
    totals.bytes += file.size;

    if (IMAGE_EXTS.has(file.ext)) {
      counts.textures += 1;
      totals.textureBytes += file.size;
      auditTexture(file, input.budget, input.projectRoot, findings);
    } else if (AUDIO_EXTS.has(file.ext)) {
      counts.audio += 1;
      totals.audioBytes += file.size;
      auditAudio(file, input.budget, input.projectRoot, findings);
    } else if (MESH_EXTS.has(file.ext)) {
      counts.meshes += 1;
      totals.meshBytes += file.size;
      auditMesh(file, input.budget, input.projectRoot, findings);
    } else if (SOURCE_ARTWORK_EXTS.has(file.ext)) {
      counts.sourceArtwork += 1;
      totals.sourceArtworkBytes += file.size;
      // Source artwork is for LFS, not runtime. Just track size; flag massive ones.
      if (file.size > 200 * 1024 * 1024) {
        findings.push({
          severity: "P2",
          category: "texture",
          relPath: relTo(file, input.projectRoot),
          detail: `Source artwork ${formatBytes(file.size)} — bloats clone time even via LFS`,
          proposal: "Split layers or move to external storage",
          sizeBytes: file.size,
        });
      }
    }

    auditNaming(file, input.projectRoot, findings);
  }

  if (engine === "unity") {
    auditUnityMetaIntegrity(input.projectRoot, allFiles, findings);
  }

  // Atlas observation: surface files matching atlas hints as candidates for atlas-waste review.
  for (const file of allFiles) {
    if (!IMAGE_EXTS.has(file.ext)) continue;
    const lower = file.baseName.toLowerCase();
    if (ATLAS_HINTS.some((h) => lower.includes(h))) {
      findings.push({
        severity: "INFO",
        category: "atlas",
        relPath: relTo(file, input.projectRoot),
        detail: "Detected atlas candidate — automated packing analysis requires engine tooling",
        proposal: "Run `/asset-audit` interactively to inspect packing ratio with the engine importer",
        sizeBytes: file.size,
      });
    }
  }

  // Build-size summary check.
  const runtimeBytes = totals.bytes - totals.sourceArtworkBytes;
  const underBudget =
    !input.budget.totalBuildMB || runtimeBytes <= input.budget.totalBuildMB * 1024 * 1024;
  if (input.budget.totalBuildMB && !underBudget) {
    findings.push({
      severity: "P0",
      category: "summary",
      relPath: "<aggregate>",
      detail: `Runtime asset total ${formatBytes(runtimeBytes)} exceeds platform cap ${input.budget.totalBuildMB} MB`,
      proposal: "Compress textures, re-encode audio, drop unused assets",
      sizeBytes: runtimeBytes,
    });
  }

  // Total atlas-style texture budget check.
  const atlasCapBytes = input.budget.totalAtlasMB * 1024 * 1024;
  if (totals.textureBytes > atlasCapBytes) {
    findings.push({
      severity: "P1",
      category: "summary",
      relPath: "<aggregate>",
      detail: `Total texture bytes ${formatBytes(totals.textureBytes)} exceed platform texture-memory budget ${input.budget.totalAtlasMB} MB`,
      proposal: "Recompress with platform-native format (Crunch / ASTC / BC7); add LODs",
      sizeBytes: totals.textureBytes,
    });
  }

  const proposedActions = rankProposals(findings);

  return {
    generatedAt: isoDate(),
    platform: input.platformKey,
    budget: input.budget,
    scanRoots: roots.map((r) => relative(input.projectRoot, r) || "."),
    engine,
    projectRoot: input.projectRoot,
    counts,
    totals,
    findings,
    proposedActions,
    underBudget,
  };
}

function relTo(file: WalkedFile, projectRoot: string): string {
  return relative(projectRoot, file.absPath).split("\\").join("/");
}

function auditTexture(
  file: WalkedFile,
  budget: PlatformBudget,
  projectRoot: string,
  findings: AssetFinding[],
): void {
  let width: number | undefined;
  let height: number | undefined;
  try {
    const buf = readFileSync(file.absPath);
    const result = imageSize(buf);
    width = result.width;
    height = result.height;
  } catch {
    findings.push({
      severity: "P2",
      category: "texture",
      relPath: relTo(file, projectRoot),
      detail: `Unable to read image dimensions (${file.ext})`,
      proposal: "Verify the file is a valid image",
      sizeBytes: file.size,
    });
    return;
  }

  if (width === undefined || height === undefined) return;

  const maxDim = Math.max(width, height);
  if (maxDim > budget.textureMax) {
    findings.push({
      severity: "P1",
      category: "texture",
      relPath: relTo(file, projectRoot),
      detail: `${width}×${height} exceeds platform max ${budget.textureMax}`,
      proposal: `Resize to ${budget.textureMax}px max dimension or set Max Size override per platform`,
      sizeBytes: file.size,
      width,
      height,
    });
  }

  if (!isPowerOfTwo(width) || !isPowerOfTwo(height)) {
    // Power-of-two preferred for compression formats.
    findings.push({
      severity: "P2",
      category: "texture",
      relPath: relTo(file, projectRoot),
      detail: `${width}×${height} is not power-of-two — compression formats prefer POT`,
      proposal: "Pad or resize to nearest POT (256, 512, 1024, 2048, 4096)",
      sizeBytes: file.size,
      width,
      height,
    });
  }
}

function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

function auditAudio(
  file: WalkedFile,
  budget: PlatformBudget,
  projectRoot: string,
  findings: AssetFinding[],
): void {
  // WAV → uncompressed, almost always wrong in shipped builds.
  if (file.ext === ".wav") {
    findings.push({
      severity: "P1",
      category: "audio",
      relPath: relTo(file, projectRoot),
      detail: `Uncompressed WAV (${formatBytes(file.size)}) shipping in build`,
      proposal: "Re-encode to Vorbis/OGG (BGM) or compressed PCM (short SFX); keep WAV only as source",
      sizeBytes: file.size,
    });
  }

  // FLAC — also uncompressed-ish for game purposes.
  if (file.ext === ".flac") {
    findings.push({
      severity: "P2",
      category: "audio",
      relPath: relTo(file, projectRoot),
      detail: `FLAC (${formatBytes(file.size)}) in build — most games use Vorbis or platform-native compression`,
      proposal: "Re-encode to Vorbis at " + budget.audioBitrateMaxKbps + " kbps",
      sizeBytes: file.size,
    });
  }

  // Long file in a directory that suggests SFX → probably miscategorized.
  const path = relTo(file, projectRoot).toLowerCase();
  if (file.size > 1.5 * 1024 * 1024 && /sfx|sound|effects?/.test(path) && !/music|bgm|ambient|loop/.test(path)) {
    findings.push({
      severity: "P2",
      category: "audio",
      relPath: relTo(file, projectRoot),
      detail: `Large file (${formatBytes(file.size)}) in SFX path — may be misclassified music`,
      proposal: "Move to music/ or split if it's actually a long SFX",
      sizeBytes: file.size,
    });
  }
}

function auditMesh(
  file: WalkedFile,
  budget: PlatformBudget,
  projectRoot: string,
  findings: AssetFinding[],
): void {
  // Without engine tooling we can't read triangle counts. Surface large mesh files
  // and source-format meshes (.blend/.max) shipping in build as findings.
  if (file.ext === ".blend" || file.ext === ".max" || file.ext === ".3ds") {
    findings.push({
      severity: "P1",
      category: "mesh",
      relPath: relTo(file, projectRoot),
      detail: `Source-format mesh (${file.ext}) shipping in build`,
      proposal: "Export to FBX or glTF for runtime; keep " + file.ext + " as source only",
      sizeBytes: file.size,
    });
  }

  if (file.size > 10 * 1024 * 1024) {
    findings.push({
      severity: "P2",
      category: "mesh",
      relPath: relTo(file, projectRoot),
      detail: `Large mesh (${formatBytes(file.size)}) — likely above platform tri budget (env ${budget.meshTrisEnv}, char ${budget.meshTrisChar})`,
      proposal: "Decimate, add LOD chain, or split into multiple meshes",
      sizeBytes: file.size,
    });
  }
}

function auditNaming(file: WalkedFile, projectRoot: string, findings: AssetFinding[]): void {
  const baseName = file.baseName;
  if (baseName === ".DS_Store") return;
  if (baseName.endsWith(".meta")) return;
  if (baseName.startsWith(".")) return;

  const issues: string[] = [];
  if (/\s/.test(baseName)) issues.push("contains spaces");
  if (/__/.test(baseName)) issues.push("contains double underscores");
  if (/[A-Z]/.test(baseName.slice(0, baseName.lastIndexOf(".") === -1 ? baseName.length : baseName.lastIndexOf(".")))) {
    // Only flag if the file is in a directory full of lowercase peers — heuristic
    // for an unintended uppercase rather than a legitimate convention.
    issues.push("contains uppercase (verify convention)");
  }
  if (issues.length === 0) return;

  // Only surface uppercase warnings as INFO (taste-dependent); spaces / double-underscore as P2.
  const severity: Severity =
    issues.some((i) => i === "contains spaces" || i === "contains double underscores") ? "P2" : "INFO";

  findings.push({
    severity,
    category: "naming",
    relPath: relTo(file, projectRoot),
    detail: issues.join(", "),
    proposal: "Rename to kebab-case or snake_case; align with team naming convention",
    sizeBytes: file.size,
  });
}

function auditUnityMetaIntegrity(
  projectRoot: string,
  allFiles: WalkedFile[],
  findings: AssetFinding[],
): void {
  const gitignorePath = join(projectRoot, ".gitignore");
  if (existsSync(gitignorePath)) {
    try {
      const text = readFileSync(gitignorePath, "utf8");
      const lines = text.split(/\r?\n/).map((l) => l.trim());
      const matchesMeta = lines.some(
        (l) =>
          !l.startsWith("#") &&
          l.length > 0 &&
          (/^\*\.meta$/.test(l) || /\.meta\/?$/.test(l) || /(^|\/)\.meta\b/.test(l)),
      );
      if (matchesMeta) {
        findings.push({
          severity: "P0",
          category: "critical",
          relPath: ".gitignore",
          detail: ".meta files are excluded by .gitignore — GUID regenerates on import, breaks every scene reference",
          proposal: "Remove the .meta exclusion. Commit every .meta sibling to Assets/ files.",
        });
      }
    } catch {
      /* ignore */
    }
  }

  const assetFiles = allFiles.filter((f) => f.relPath.startsWith("Assets/") || /\/Assets\//.test(f.absPath));
  const metaSet = new Set(assetFiles.filter((f) => f.ext === ".meta").map((f) => f.absPath));
  for (const f of assetFiles) {
    if (f.ext === ".meta") continue;
    if (f.relPath.endsWith(".DS_Store")) continue;
    const metaPath = f.absPath + ".meta";
    if (!metaSet.has(metaPath)) {
      findings.push({
        severity: "P0",
        category: "critical",
        relPath: relative(projectRoot, f.absPath).split("\\").join("/"),
        detail: "Unity asset missing its .meta sibling — GUID will regenerate, breaking references",
        proposal: "Restore the missing .meta from a previous commit or let Unity regenerate, then re-link references.",
      });
    }
  }
}

function rankProposals(findings: AssetFinding[]): { rank: number; action: string; estSavingsBytes?: number }[] {
  const buckets = new Map<string, { action: string; estSavingsBytes: number; count: number }>();

  for (const f of findings) {
    if (f.category === "atlas" || f.category === "summary" || f.category === "critical") continue;
    const key = f.proposal;
    const cur = buckets.get(key) ?? { action: f.proposal, estSavingsBytes: 0, count: 0 };
    cur.estSavingsBytes += estimateSavings(f);
    cur.count += 1;
    buckets.set(key, cur);
  }

  const sorted = [...buckets.values()]
    .sort((a, b) => b.estSavingsBytes - a.estSavingsBytes)
    .slice(0, 10)
    .map((v, idx) => ({
      rank: idx + 1,
      action: `${v.action} (${v.count} file${v.count === 1 ? "" : "s"})`,
      estSavingsBytes: v.estSavingsBytes > 0 ? v.estSavingsBytes : undefined,
    }));

  return sorted;
}

function estimateSavings(f: AssetFinding): number {
  if (f.sizeBytes === undefined) return 0;
  if (f.category === "audio" && f.detail.includes("Uncompressed WAV")) return Math.floor(f.sizeBytes * 0.85);
  if (f.category === "audio" && f.detail.startsWith("FLAC")) return Math.floor(f.sizeBytes * 0.6);
  if (f.category === "texture" && f.detail.includes("exceeds platform max")) return Math.floor(f.sizeBytes * 0.5);
  if (f.category === "mesh") return Math.floor(f.sizeBytes * 0.4);
  return 0;
}
