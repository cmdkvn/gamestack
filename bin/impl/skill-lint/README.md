# gamestack-skill-lint

Regression validator for SKILL.md files and playtest scenario JSON. Catches the drift modes that cause skills to silently stop working: missing frontmatter, mismatched directory/name, broken cross-links, unknown step types in scenarios, README.md inside `.claude/{skills,commands,agents}/` (auto-registers and pollutes the tool list).

Wire it into CI to fail on regressions before merge.

## Install

```bash
brew install bun                                 # runtime; one-time
gamestack/bin/gamestack-skill-lint --help
```

## Usage

```bash
# Lint from inside the gamestack checkout.
gamestack-skill-lint

# Explicit root.
gamestack-skill-lint --gamestack /path/to/gamestack

# CI gate (strictest threshold).
gamestack-skill-lint --warn-as-error --format json --out lint.json
```

### Flags

| Flag | Default | Notes |
|---|---|---|
| `--gamestack <path>` | auto-detect | Gamestack repo root. Auto-detects by walking up from `cwd` looking for `skills/` + `setup`. |
| `--format <md\|json\|both>` | `md` | Output format. |
| `--out <path>` | — | Write report to a file. |
| `--warn-as-error` | off | Exit 1 on WARNs as well as ERRORs. |

### Exit codes

| Code | Meaning |
|---|---|
| `0` | No findings above threshold. |
| `1` | At least one finding above threshold (CI fail). |
| `2` | Invalid args or unreachable repo. |
| `127` | `bun` not installed. |

## Rules

### Skill rules

| Rule | Severity | Catches |
|---|---|---|
| `skill/readable` | ERROR | `SKILL.md` unreadable. |
| `skill/frontmatter-present` | ERROR | Missing or malformed YAML frontmatter. |
| `skill/frontmatter-key-name` | ERROR | Frontmatter missing `name`. |
| `skill/frontmatter-key-description` | ERROR | Frontmatter missing `description`. |
| `skill/frontmatter-name-matches-dir` | ERROR | `name:` value doesn't match the skill directory name (breaks discovery). |
| `skill/has-top-heading` | ERROR | No `# Skill name` heading after the frontmatter. |
| `skill/recommended-sections` | WARN | Fewer than 2 of the four recommended sections (When to fire / Process / Output / Related). |
| `skill/avoid-bare-readme-link` | WARN | Bare `(README.md)` link is ambiguous; use a full relative path. |

### Scenario rules

| Rule | Severity | Catches |
|---|---|---|
| `scenario/valid-json` | ERROR | File doesn't parse as JSON. |
| `scenario/schema` | ERROR | Required scenario fields missing or malformed. |
| `scenario/step-type-known` | ERROR | Uses a step type outside the 9-primitive contract (`wait`, `wait_for_state`, `input`, `screenshot`, `snapshot`, `restore`, `breakpoint`, `assert_state`, `assert_recent_breakpoint`). Adding a new primitive without updating the contract breaks every existing scenario. |

### Cross-link rules

| Rule | Severity | Catches |
|---|---|---|
| `links/skill-target-exists` | ERROR | A `[\`/foo\`](../skills/foo/SKILL.md)` link (or two-level `../../skills/foo/SKILL.md` from howtos) points to a skill directory that doesn't exist. |

### Claude Code rules

| Rule | Severity | Catches |
|---|---|---|
| `claude/no-readme-in-claude-dirs` | ERROR | `README.md` inside `.claude/{skills,commands,agents}/`. Claude Code auto-registers it as a skill/command/agent and pollutes the tool list. Put documentation in `.claude/README.md` (the parent level). |

## Example CI usage

```yaml
# .github/workflows/skill-lint.yml
on: [pull_request]
jobs:
  skill-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: gamestack-skill-lint --warn-as-error --format json --out lint.json
      - if: always()
        uses: actions/upload-artifact@v4
        with: { name: skill-lint, path: lint.json }
```

## Adding a new rule

1. Append a finding-producing block to the appropriate function in `lint.ts` (`lintSkill`, `lintScenario`, `lintCrossLinks`, etc.).
2. Add a test in `lint.test.ts` that constructs a scratch fixture that should fire the rule and asserts it does.
3. Document the rule in this README.

The rules deliberately err on the side of WARN over ERROR. ERROR-level rules should reflect things that genuinely break the system; WARNs are for conventions worth maintaining but not worth blocking a merge over.

## Related

- [`gamestack/skills/playtest/scenarios/README.md`](../../../skills/playtest/scenarios/README.md) — the scenario format spec (the contract `scenario/step-type-known` enforces).
- [`gamestack/.claude/CLAUDE.md`](../../../.claude/CLAUDE.md) — repo-internal conventions for editing skills.
- Every other CLI under [`../../bin/`](../README.md) — same shim shape, same exit code scheme.
