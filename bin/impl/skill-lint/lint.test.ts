import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, writeFileSync, rmSync, existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runLint } from "./lint.ts";
import { renderMarkdown } from "./render.ts";

let scratchRoot: string;

beforeAll(() => {
  scratchRoot = mkdtempSync(join(tmpdir(), "skill-lint-test-"));
  // Set up a minimal gamestack-like layout.
  mkdirSync(join(scratchRoot, "skills"), { recursive: true });
  mkdirSync(join(scratchRoot, "skills", "playtest", "scenarios"), { recursive: true });
  mkdirSync(join(scratchRoot, "docs", "templates"), { recursive: true });
  // Seed one real template so positive-case lookups succeed.
  writeFileSync(join(scratchRoot, "docs", "templates", "pitch.md"), "# pitch template\n");
});

afterAll(() => {
  if (existsSync(scratchRoot)) rmSync(scratchRoot, { recursive: true, force: true });
});

function writeSkill(name: string, content: string) {
  const dir = join(scratchRoot, "skills", name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "SKILL.md"), content);
}

function deleteSkill(name: string) {
  rmSync(join(scratchRoot, "skills", name), { recursive: true, force: true });
}

describe("runLint", () => {
  test("flags skill with missing frontmatter as ERROR", () => {
    writeSkill("no-frontmatter", "# no frontmatter\n\nnothing.\n");
    const r = runLint({ gamestackRoot: scratchRoot });
    expect(r.findings.some((f) => f.rule === "skill/frontmatter-present" && f.path.includes("no-frontmatter"))).toBe(true);
    expect(r.counts.ERROR).toBeGreaterThan(0);
    deleteSkill("no-frontmatter");
  });

  test("flags skill whose frontmatter name mismatches its dir", () => {
    writeSkill(
      "mismatched",
      `---\nname: not-mismatched\ndescription: stuff\n---\n\n# Whatever\n\n## When to fire\n## Process\n## Related\n`,
    );
    const r = runLint({ gamestackRoot: scratchRoot });
    expect(r.findings.some((f) => f.rule === "skill/frontmatter-name-matches-dir")).toBe(true);
    deleteSkill("mismatched");
  });

  test("flags skill missing required keys", () => {
    writeSkill(
      "no-description",
      `---\nname: no-description\n---\n\n# No description\n\n## When to fire\n## Process\n## Related\n`,
    );
    const r = runLint({ gamestackRoot: scratchRoot });
    expect(r.findings.some((f) => f.rule === "skill/frontmatter-key-description")).toBe(true);
    deleteSkill("no-description");
  });

  test("clean skill passes all rules", () => {
    writeSkill(
      "clean-skill",
      `---\nname: clean-skill\ndescription: A clean skill.\n---\n\n# clean-skill\n\n## When to fire\nNow.\n## The lens\nA lens.\n## Output format\nstuff.\n## Related\nlinks.\n`,
    );
    const r = runLint({ gamestackRoot: scratchRoot });
    const cleanFindings = r.findings.filter((f) => f.path.includes("clean-skill"));
    expect(cleanFindings.length).toBe(0);
    deleteSkill("clean-skill");
  });

  test("warns on skill missing recommended sections", () => {
    writeSkill(
      "sparse",
      `---\nname: sparse\ndescription: empty.\n---\n\n# sparse\n\njust prose, no sections.\n`,
    );
    const r = runLint({ gamestackRoot: scratchRoot });
    expect(r.findings.some((f) => f.path.includes("sparse") && f.rule === "skill/recommended-sections")).toBe(true);
    deleteSkill("sparse");
  });

  test("catches broken cross-link to non-existent skill", () => {
    writeSkill(
      "linker",
      `---\nname: linker\ndescription: links elsewhere.\n---\n\n# linker\n\n## When to fire\nyes.\n## Related\n[\`/ghost\`](../skills/ghost/SKILL.md)\n## Process\n## Output\n`,
    );
    const r = runLint({ gamestackRoot: scratchRoot });
    expect(r.findings.some((f) => f.rule === "links/skill-target-exists" && f.detail.includes("ghost"))).toBe(true);
    deleteSkill("linker");
  });

  test("catches scenario with unknown step type", () => {
    const path = join(scratchRoot, "skills", "playtest", "scenarios", "bad.json");
    writeFileSync(
      path,
      JSON.stringify({
        name: "bad",
        phase: "prototype",
        description: "test",
        steps: [{ type: "teleport" }],
      }),
    );
    const r = runLint({ gamestackRoot: scratchRoot });
    expect(r.findings.some((f) => f.rule === "scenario/schema" || f.rule === "scenario/step-type-known")).toBe(true);
    rmSync(path);
  });

  test("catches malformed JSON scenario", () => {
    const path = join(scratchRoot, "skills", "playtest", "scenarios", "broken.json");
    writeFileSync(path, "not json at all");
    const r = runLint({ gamestackRoot: scratchRoot });
    expect(r.findings.some((f) => f.rule === "scenario/valid-json")).toBe(true);
    rmSync(path);
  });

  test("catches README.md in .claude/skills/", () => {
    const dir = join(scratchRoot, ".claude", "skills");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "README.md"), "should not be here");
    const r = runLint({ gamestackRoot: scratchRoot });
    expect(r.findings.some((f) => f.rule === "claude/no-readme-in-claude-dirs")).toBe(true);
    rmSync(join(scratchRoot, ".claude"), { recursive: true, force: true });
  });

  test("renderMarkdown produces non-empty report", () => {
    const r = runLint({ gamestackRoot: scratchRoot });
    const md = renderMarkdown(r);
    expect(md).toContain("# gamestack — skill regression lint");
    expect(md.length).toBeGreaterThan(100);
  });

  test("warn-as-error flips verdict to FAIL on WARNs", () => {
    writeSkill(
      "warns-only",
      `---\nname: warns-only\ndescription: prose only.\n---\n\n# warns-only\n\njust prose.\n`,
    );
    const lenient = runLint({ gamestackRoot: scratchRoot, warnAsError: false });
    const strict = runLint({ gamestackRoot: scratchRoot, warnAsError: true });
    expect(lenient.passed).toBe(true);
    expect(strict.passed).toBe(false);
    deleteSkill("warns-only");
  });

  test("catches link to non-existent template", () => {
    writeSkill(
      "template-linker",
      `---\nname: template-linker\ndescription: links to a template.\n---\n\n# template-linker\n\n## When to fire\nnow.\n## Process\nstuff.\n## Output\nWrite to design/nonexistent.md — schema: see [\`docs/templates/nonexistent.md\`](../../docs/templates/nonexistent.md).\n## Related\nlinks.\n`,
    );
    const r = runLint({ gamestackRoot: scratchRoot });
    const offending = r.findings.filter(
      (f) => f.rule === "templates/link-target-exists" && f.path.includes("template-linker"),
    );
    expect(offending.length).toBe(1);
    expect(offending[0]?.detail).toContain("nonexistent");
    deleteSkill("template-linker");
  });

  test("template link to existing pitch.md produces no finding", () => {
    writeSkill(
      "good-template-linker",
      `---\nname: good-template-linker\ndescription: links to a real template.\n---\n\n# good-template-linker\n\n## When to fire\nnow.\n## Process\nstuff.\n## Output\nWrite to design/pitch.md — schema: see [\`docs/templates/pitch.md\`](../../docs/templates/pitch.md).\n## Related\nlinks.\n`,
    );
    const r = runLint({ gamestackRoot: scratchRoot });
    const offending = r.findings.filter(
      (f) => f.rule === "templates/link-target-exists" && f.path.includes("good-template-linker"),
    );
    expect(offending.length).toBe(0);
    deleteSkill("good-template-linker");
  });
});
