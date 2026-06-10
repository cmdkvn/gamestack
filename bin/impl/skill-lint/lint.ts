import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, basename } from "node:path";
import { isoDate } from "../shared/format.ts";
import { ALL_STEP_TYPES, validateScenario } from "../shared/scenario.ts";

export type Severity = "ERROR" | "WARN" | "INFO";

export interface LintFinding {
  severity: Severity;
  path: string;
  rule: string;
  detail: string;
}

export interface LintReport {
  generatedAt: string;
  gamestackRoot: string;
  skillCount: number;
  scenarioCount: number;
  findings: LintFinding[];
  counts: Record<Severity, number>;
  passed: boolean;
}

export interface LintInput {
  gamestackRoot: string;
  warnAsError?: boolean;
}

const REQUIRED_FRONTMATTER_KEYS = ["name", "description"] as const;
const RECOMMENDED_HEADINGS = [
  /^## (When to fire|When to use)\b/m,
  /^## (Process|The lens|What .* looks like)\b/m,
  /^## (Output|Output format)\b/m,
  /^## (Related|Handoff)\b/m,
];
const REQUIRED_TOP_HEADING_PREFIX = "# ";
const FORBIDDEN_RELATIVE_LINK = /\]\(README\.md\)/;

const HOWTO_RECOMMENDED_HEADINGS = [
  /^## What just happened\b/m,
  /^## What comes next\b/m,
  /^## Related\b/m,
];

export function runLint(input: LintInput): LintReport {
  const findings: LintFinding[] = [];
  const skillsDir = join(input.gamestackRoot, "skills");
  const skillDirs = listSkillDirs(skillsDir);

  for (const skillDir of skillDirs) {
    lintSkill(skillDir, input.gamestackRoot, findings);
  }

  const scenarios = listScenarios(join(skillsDir, "playtest", "scenarios"));
  for (const scenario of scenarios) {
    lintScenario(scenario, input.gamestackRoot, findings);
  }

  lintNoReadmeInClaudeDirs(input.gamestackRoot, findings);
  lintCrossLinks(skillDirs, input.gamestackRoot, findings);

  const counts: Record<Severity, number> = { ERROR: 0, WARN: 0, INFO: 0 };
  for (const f of findings) counts[f.severity] += 1;

  const passed = input.warnAsError
    ? counts.ERROR === 0 && counts.WARN === 0
    : counts.ERROR === 0;

  return {
    generatedAt: isoDate(),
    gamestackRoot: input.gamestackRoot,
    skillCount: skillDirs.length,
    scenarioCount: scenarios.length,
    findings,
    counts,
    passed,
  };
}

function listSkillDirs(skillsDir: string): string[] {
  if (!existsSync(skillsDir)) return [];
  const entries = readdirSync(skillsDir);
  const out: string[] = [];
  for (const e of entries) {
    const abs = join(skillsDir, e);
    try {
      if (statSync(abs).isDirectory() && existsSync(join(abs, "SKILL.md"))) {
        out.push(abs);
      }
    } catch {
      // ignore
    }
  }
  return out.sort();
}

function listScenarios(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .map((f) => join(dir, f))
    .sort();
}

function lintSkill(skillDir: string, root: string, findings: LintFinding[]): void {
  const skillName = basename(skillDir);
  const skillFile = join(skillDir, "SKILL.md");
  const rel = relative(root, skillFile);
  let text: string;
  try {
    text = readFileSync(skillFile, "utf8");
  } catch (err) {
    findings.push({
      severity: "ERROR",
      path: rel,
      rule: "skill/readable",
      detail: `cannot read SKILL.md: ${(err as Error).message}`,
    });
    return;
  }

  const fm = parseFrontmatter(text);
  if (!fm) {
    findings.push({
      severity: "ERROR",
      path: rel,
      rule: "skill/frontmatter-present",
      detail: "missing or malformed YAML frontmatter (--- ... --- block at top)",
    });
  } else {
    for (const key of REQUIRED_FRONTMATTER_KEYS) {
      if (!fm[key]) {
        findings.push({
          severity: "ERROR",
          path: rel,
          rule: `skill/frontmatter-key-${key}`,
          detail: `frontmatter missing '${key}'`,
        });
      }
    }
    if (fm.name && fm.name !== skillName) {
      findings.push({
        severity: "ERROR",
        path: rel,
        rule: "skill/frontmatter-name-matches-dir",
        detail: `frontmatter name '${fm.name}' does not match directory '${skillName}'`,
      });
    }
  }

  const body = stripFrontmatter(text);
  if (!body.split("\n").some((l) => l.startsWith(REQUIRED_TOP_HEADING_PREFIX))) {
    findings.push({
      severity: "ERROR",
      path: rel,
      rule: "skill/has-top-heading",
      detail: "missing `# Skill name` heading after frontmatter",
    });
  }

  let matchedHeadings = 0;
  for (const re of RECOMMENDED_HEADINGS) {
    if (re.test(body)) matchedHeadings += 1;
  }
  if (matchedHeadings < 2) {
    findings.push({
      severity: "WARN",
      path: rel,
      rule: "skill/recommended-sections",
      detail: `only ${matchedHeadings}/4 recommended sections present (When to fire, Process/lens/session, Output, Related)`,
    });
  }

  if (FORBIDDEN_RELATIVE_LINK.test(text)) {
    findings.push({
      severity: "WARN",
      path: rel,
      rule: "skill/avoid-bare-readme-link",
      detail: "bare `(README.md)` link is ambiguous; use a full relative path",
    });
  }
}

function lintScenario(scenarioPath: string, root: string, findings: LintFinding[]): void {
  const rel = relative(root, scenarioPath);
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(scenarioPath, "utf8"));
  } catch (err) {
    findings.push({
      severity: "ERROR",
      path: rel,
      rule: "scenario/valid-json",
      detail: `cannot parse JSON: ${(err as Error).message}`,
    });
    return;
  }
  const validated = validateScenario(raw);
  if (!validated.ok) {
    for (const e of validated.errors) {
      findings.push({
        severity: "ERROR",
        path: rel,
        rule: "scenario/schema",
        detail: e,
      });
    }
    return;
  }
  const usedTypes = new Set<string>();
  const collectTypes = (steps: { type: string }[] | undefined) => {
    if (!steps) return;
    for (const s of steps) {
      if (typeof s.type === "string") usedTypes.add(s.type);
    }
  };
  collectTypes(validated.scenario.setup as { type: string }[] | undefined);
  collectTypes(validated.scenario.steps as { type: string }[]);
  collectTypes(validated.scenario.teardown as { type: string }[] | undefined);

  for (const t of usedTypes) {
    if (!ALL_STEP_TYPES.includes(t as (typeof ALL_STEP_TYPES)[number])) {
      findings.push({
        severity: "ERROR",
        path: rel,
        rule: "scenario/step-type-known",
        detail: `unknown step type '${t}' (known: ${ALL_STEP_TYPES.join(", ")})`,
      });
    }
  }
}

function lintNoReadmeInClaudeDirs(root: string, findings: LintFinding[]): void {
  const trouble = [
    join(root, ".claude", "skills"),
    join(root, ".claude", "commands"),
    join(root, ".claude", "agents"),
  ];
  for (const dir of trouble) {
    if (!existsSync(dir)) continue;
    const candidate = join(dir, "README.md");
    if (existsSync(candidate)) {
      findings.push({
        severity: "ERROR",
        path: relative(root, candidate),
        rule: "claude/no-readme-in-claude-dirs",
        detail: "README.md inside .claude/{skills,commands,agents}/ gets auto-registered; use .claude/README.md instead",
      });
    }
  }
}

function collectDocsToCheck(root: string, skillDirs: string[]): string[] {
  const docs: string[] = [];
  pushIfExists(docs, join(root, "docs", "skills.md"));
  pushIfExists(docs, join(root, "docs", "ROLES.md"));
  pushIfExists(docs, join(root, "docs", "ENGINES.md"));
  pushIfExists(docs, join(root, "docs", "CERT.md"));
  pushIfExists(docs, join(root, "docs", "ACCESSIBILITY.md"));
  pushIfExists(docs, join(root, "docs", "PLATFORMS.md"));
  pushIfExists(docs, join(root, "docs", "templates", "README.md"));

  const howtoDir = join(root, "docs", "howto");
  if (existsSync(howtoDir)) {
    for (const f of readdirSync(howtoDir)) {
      if (f.endsWith(".md")) docs.push(join(howtoDir, f));
    }
  }

  for (const skillDir of skillDirs) {
    docs.push(join(skillDir, "SKILL.md"));
  }

  return docs;
}

function lintCrossLinks(skillDirs: string[], root: string, findings: LintFinding[]): void {
  const skillNames = new Set(skillDirs.map((d) => basename(d)));
  const skillPathRe = /\(\.\.\/skills\/([a-z0-9-]+)\/SKILL\.md\)/g;
  const skillsDoubleHopRe = /\(\.\.\/\.\.\/skills\/([a-z0-9-]+)\/SKILL\.md\)/g;

  const docsToCheck = collectDocsToCheck(root, skillDirs);

  for (const doc of docsToCheck) {
    let text: string;
    try {
      text = readFileSync(doc, "utf8");
    } catch {
      continue;
    }
    const re = doc.includes("/docs/howto/") ? skillsDoubleHopRe : skillPathRe;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const target = m[1];
      if (target && !skillNames.has(target)) {
        findings.push({
          severity: "ERROR",
          path: relative(root, doc),
          rule: "links/skill-target-exists",
          detail: `link points to ../skills/${target}/SKILL.md but no such skill exists`,
        });
      }
    }
    re.lastIndex = 0;
  }
}

function pushIfExists(arr: string[], path: string): void {
  if (existsSync(path)) arr.push(path);
}

function parseFrontmatter(text: string): Record<string, string> | null {
  if (!text.startsWith("---")) return null;
  const end = text.indexOf("\n---", 4);
  if (end < 0) return null;
  const block = text.slice(3, end).trim();
  const out: Record<string, string> = {};
  for (const line of block.split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    out[key] = value;
  }
  return out;
}

function stripFrontmatter(text: string): string {
  if (!text.startsWith("---")) return text;
  const end = text.indexOf("\n---", 4);
  if (end < 0) return text;
  return text.slice(end + 4).replace(/^\r?\n/, "");
}
