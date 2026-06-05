import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { execSync } from "node:child_process";
import {
  type CertCategory,
  type Platform,
  type Verdict,
  categoriesFor,
  platformDisplayName,
} from "../shared/cert-categories.ts";
import { detectEngine, type Engine, scriptExtensions, scriptRoots } from "../shared/engine.ts";
import { walk } from "../shared/fs-walk.ts";
import { isoDate } from "../shared/format.ts";

export interface CategoryResult {
  category: CertCategory;
  verdict: Verdict;
  detail: string;
  evidence: {
    codeMatches: string[];
    configMatches: string[];
    recentScenarioRuns: string[];
  };
}

export interface PlatformReport {
  platform: Platform;
  displayName: string;
  checklistVersionOnFile: string | null;
  buildRev: string | null;
  engine: Engine;
  results: CategoryResult[];
  counts: Record<Verdict, number>;
  submissionReadiness: "READY" | "NEEDS_WORK" | "BLOCKED";
  readinessReason: string;
}

export interface CertReport {
  generatedAt: string;
  projectRoot: string;
  engine: Engine;
  platforms: PlatformReport[];
  actionList: {
    p0: ActionItem[];
    p1: ActionItem[];
    needsLiveTest: ActionItem[];
  };
  reminder: string;
}

export interface ActionItem {
  platform: string;
  category: string;
  action: string;
  scenario?: string;
}

export interface CheckInput {
  projectRoot: string;
  platforms: Platform[];
  engineHint?: Engine;
}

export function runCertCheck(input: CheckInput): CertReport {
  const engine = input.engineHint ?? detectEngine(input.projectRoot);
  const scriptCorpus = collectScriptCorpus(input.projectRoot, engine);
  const playtestRuns = collectPlaytestRuns(input.projectRoot);
  const buildRev = readGitRev(input.projectRoot);

  const platforms: PlatformReport[] = input.platforms.map((p) =>
    runPlatform(p, input.projectRoot, engine, scriptCorpus, playtestRuns, buildRev),
  );

  const actionList = buildActionList(platforms);

  return {
    generatedAt: isoDate(),
    projectRoot: input.projectRoot,
    engine,
    platforms,
    actionList,
    reminder:
      "This audit covers public-knowledge high-failure-rate categories only. " +
      "It is NOT a substitute for the NDA-protected TRC / TCR / lotcheck. " +
      "Download the current platform checklist from the developer portal before submission.",
  };
}

interface ScriptCorpus {
  files: { path: string; relPath: string; content: string }[];
}

function collectScriptCorpus(projectRoot: string, engine: Engine): ScriptCorpus {
  const exts = new Set(scriptExtensions(engine));
  const roots = scriptRoots(projectRoot, engine).filter((r) => existsSync(r));
  const corpus: ScriptCorpus = { files: [] };
  for (const root of roots) {
    const files = walk(root, { excludeDirNames: ["node_modules", ".godot", ".import", "Library", "Temp", "Obj", "obj"] });
    for (const f of files) {
      if (!exts.has(f.ext)) continue;
      let content: string;
      try {
        content = readFileSync(f.absPath, "utf8");
      } catch {
        continue;
      }
      corpus.files.push({ path: f.absPath, relPath: relative(projectRoot, f.absPath).split("\\").join("/"), content });
    }
  }
  return corpus;
}

interface PlaytestRun {
  dir: string;
  scenarioFile: string | null;
  modifiedAt: number;
}

function collectPlaytestRuns(projectRoot: string): PlaytestRun[] {
  const playtestDir = join(projectRoot, "playtest");
  if (!existsSync(playtestDir)) return [];
  let entries: string[];
  try {
    entries = readdirSync(playtestDir);
  } catch {
    return [];
  }
  const runs: PlaytestRun[] = [];
  for (const e of entries) {
    if (!e.startsWith("playtest-")) continue;
    const dir = join(playtestDir, e);
    let st;
    try {
      st = statSync(dir);
    } catch {
      continue;
    }
    if (!st.isDirectory()) continue;

    let scenarioFile: string | null = null;
    // The scenario filename is typically embedded in run metadata; look for a manifest.
    const manifestCandidates = ["run.json", "scenario.json", "manifest.json"];
    for (const m of manifestCandidates) {
      const path = join(dir, m);
      if (existsSync(path)) {
        try {
          const data = JSON.parse(readFileSync(path, "utf8"));
          if (typeof data?.scenario === "string") scenarioFile = data.scenario;
          else if (typeof data?.scenarioFile === "string") scenarioFile = data.scenarioFile;
        } catch {
          // ignore
        }
        break;
      }
    }
    // Fallback: a sibling file named after the scenario.
    if (!scenarioFile) {
      try {
        for (const f of readdirSync(dir)) {
          if (f.endsWith(".json") && /^\d{2}-/.test(f)) {
            scenarioFile = f;
            break;
          }
        }
      } catch {
        // ignore
      }
    }
    runs.push({ dir, scenarioFile, modifiedAt: st.mtimeMs });
  }
  return runs;
}

function readGitRev(projectRoot: string): string | null {
  try {
    const out = execSync("git rev-parse --short HEAD", {
      cwd: projectRoot,
      stdio: ["ignore", "pipe", "ignore"],
    });
    return out.toString().trim() || null;
  } catch {
    return null;
  }
}

function runPlatform(
  platform: Platform,
  projectRoot: string,
  engine: Engine,
  corpus: ScriptCorpus,
  playtestRuns: PlaytestRun[],
  buildRev: string | null,
): PlatformReport {
  const categories = categoriesFor(platform);
  const checklistVersion = findChecklistOnFile(projectRoot, platform);

  const results = categories.map((cat) => evaluateCategory(cat, projectRoot, corpus, playtestRuns));

  const counts: Record<Verdict, number> = {
    PASS: 0, PASS_CODE_ONLY: 0, NEEDS_LIVE_TEST: 0, FAIL_P0: 0, FAIL_P1: 0, NOT_APPLICABLE: 0,
  };
  for (const r of results) counts[r.verdict] += 1;

  const submissionReadiness =
    counts.FAIL_P0 > 0
      ? "BLOCKED"
      : counts.FAIL_P1 > 0 || counts.NEEDS_LIVE_TEST > 0
      ? "NEEDS_WORK"
      : "READY";

  const readinessReason =
    submissionReadiness === "BLOCKED"
      ? `${counts.FAIL_P0} P0 blocker${counts.FAIL_P0 === 1 ? "" : "s"} — fix before submission`
      : submissionReadiness === "NEEDS_WORK"
      ? `${counts.FAIL_P1} P1 issue${counts.FAIL_P1 === 1 ? "" : "s"}, ${counts.NEEDS_LIVE_TEST} live test${counts.NEEDS_LIVE_TEST === 1 ? "" : "s"} required`
      : "Code-side categories pass; verify with current platform checklist";

  return {
    platform,
    displayName: platformDisplayName(platform),
    checklistVersionOnFile: checklistVersion,
    buildRev,
    engine,
    results,
    counts,
    submissionReadiness,
    readinessReason,
  };
}

function findChecklistOnFile(projectRoot: string, platform: Platform): string | null {
  const certDir = join(projectRoot, "docs", "cert");
  if (!existsSync(certDir)) return null;
  let entries: string[];
  try {
    entries = readdirSync(certDir);
  } catch {
    return null;
  }
  const pattern = {
    ps5: /^ps5-trc-v[\d.]+\.(pdf|md)$/i,
    xbox: /^xbox-(tcr|xr)-v[\d.]+\.(pdf|md)$/i,
    switch: /^switch-lotcheck-v[\d.]+\.(pdf|md)$/i,
  }[platform];
  const matches = entries.filter((e) => pattern.test(e));
  return matches[0] ?? null;
}

function evaluateCategory(
  category: CertCategory,
  projectRoot: string,
  corpus: ScriptCorpus,
  playtestRuns: PlaytestRun[],
): CategoryResult {
  const codeMatches: string[] = [];
  if (category.codePatterns && category.codePatterns.length > 0) {
    for (const file of corpus.files) {
      for (const pattern of category.codePatterns) {
        if (pattern.test(file.content)) {
          if (!codeMatches.includes(file.relPath)) codeMatches.push(file.relPath);
          break;
        }
      }
    }
  }

  const configMatches: string[] = [];
  if (category.configMarkers && category.configMarkers.length > 0) {
    for (const marker of category.configMarkers) {
      const path = join(projectRoot, marker);
      if (existsSync(path)) configMatches.push(marker);
    }
  }

  const recentScenarioRuns: string[] = [];
  if (category.playtestScenarios && category.playtestScenarios.length > 0) {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days
    for (const scenarioName of category.playtestScenarios) {
      const matched = playtestRuns.filter(
        (r) => r.scenarioFile === scenarioName && r.modifiedAt >= cutoff,
      );
      for (const run of matched) {
        recentScenarioRuns.push(`${scenarioName} (${dirname(relative(projectRoot, run.dir))}/${run.dir.split("/").pop()})`);
      }
    }
  }

  let verdict: Verdict;
  let detail: string;

  if (category.alwaysNeedsLiveTest) {
    if (recentScenarioRuns.length > 0) {
      verdict = "PASS";
      detail = `Verified via ${recentScenarioRuns.length} recent playtest run${recentScenarioRuns.length === 1 ? "" : "s"}`;
    } else {
      verdict = "NEEDS_LIVE_TEST";
      detail = category.notes ?? "Requires platform-level verification";
    }
    return { category, verdict, detail, evidence: { codeMatches, configMatches, recentScenarioRuns } };
  }

  const hasCodeEvidence = codeMatches.length > 0;
  const hasConfigEvidence = configMatches.length > 0;
  const hasPlaytestEvidence = recentScenarioRuns.length > 0;

  if (hasPlaytestEvidence && (hasCodeEvidence || hasConfigEvidence)) {
    verdict = "PASS";
    detail = `Code/config evidence + ${recentScenarioRuns.length} recent playtest run${recentScenarioRuns.length === 1 ? "" : "s"}`;
  } else if (hasCodeEvidence || hasConfigEvidence) {
    if (category.playtestScenarios && category.playtestScenarios.length > 0) {
      verdict = "PASS_CODE_ONLY";
      detail = `Code present; run ${category.playtestScenarios.join(", ")} to confirm`;
    } else {
      verdict = "PASS_CODE_ONLY";
      detail = "Code present; live verification recommended";
    }
  } else {
    verdict = category.defaultIfMissing;
    detail = `No code pattern matched (${(category.codePatterns ?? []).length} patterns checked)`;
    if (category.notes) detail += ` — ${category.notes}`;
  }

  return { category, verdict, detail, evidence: { codeMatches, configMatches, recentScenarioRuns } };
}

function buildActionList(platforms: PlatformReport[]): CertReport["actionList"] {
  const p0: ActionItem[] = [];
  const p1: ActionItem[] = [];
  const needsLiveTest: ActionItem[] = [];

  for (const pr of platforms) {
    if (!pr.checklistVersionOnFile) {
      p0.push({
        platform: pr.displayName,
        category: "checklist-version",
        action: `Add the current ${pr.displayName} checklist to docs/cert/ before submission`,
      });
    }
    for (const r of pr.results) {
      if (r.verdict === "FAIL_P0") {
        p0.push({
          platform: pr.displayName,
          category: r.category.name,
          action: r.detail,
        });
      } else if (r.verdict === "FAIL_P1") {
        p1.push({
          platform: pr.displayName,
          category: r.category.name,
          action: r.detail,
        });
      } else if (r.verdict === "NEEDS_LIVE_TEST") {
        const scenario = (r.category.playtestScenarios ?? [])[0];
        needsLiveTest.push({
          platform: pr.displayName,
          category: r.category.name,
          action: scenario
            ? `Run \`/playtest ${scenario}\` on ${pr.displayName} build`
            : `Run live test for ${r.category.name} on ${pr.displayName}`,
          scenario,
        });
      }
    }
  }

  return { p0, p1, needsLiveTest };
}
