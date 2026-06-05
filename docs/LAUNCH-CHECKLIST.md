# gamestack v1.0 launch checklist

The pre-v1 gates this release passed. Every gate is either an automated check that should keep passing in CI, or a piece of doc that should stay accurate. Treat this file as the contract for what "v1.0 quality" means going forward.

Every checked item is verifiable today by running the command in the **Verify** column.

## Skills

| Gate | Verify | Status |
|---|---|---|
| 38 SKILL.md files present | `find skills -name SKILL.md \| wc -l` → 38 | ✓ |
| All skills installable to Claude Code | `./setup --status` → 38 linked | ✓ |
| All skills installable to every host | `./setup --host <name> --status` for each of 9 hosts | ✓ |
| Frontmatter complete on every skill | `gamestack-skill-lint --warn-as-error` → 0 ERROR | ✓ |
| No `README.md` inside `.claude/{skills,commands,agents}/` | `gamestack-skill-lint` — `claude/no-readme-in-claude-dirs` rule | ✓ |
| Skill `name:` matches directory name | `gamestack-skill-lint` — `skill/frontmatter-name-matches-dir` rule | ✓ |

## CLIs

| Gate | Verify | Status |
|---|---|---|
| 7 CLIs shipped (M3) + 1 regression validator (M4) | `ls bin/gamestack-* \| wc -l` → 8 | ✓ |
| Each CLI has a README at `bin/impl/<name>/README.md` | `ls bin/impl/*/README.md \| wc -l` → 8 | ✓ |
| Each CLI has Bun-native tests | `find bin/impl -name '*.test.ts' \| wc -l` → 8 | ✓ |
| All tests pass | `cd bin/impl && bun test` → all pass / 0 fail | ✓ |
| TypeScript clean | `cd bin/impl && bunx tsc --noEmit` → silent | ✓ |
| Every CLI exits `127` on missing Bun | grep each shim for the bun-check block | ✓ |
| No CLI auto-uploads to console partner portals | grep for any portal/cert upload code | ✓ (none present) |

## Engine SDKs

| Gate | Verify | Status |
|---|---|---|
| Unity SDK v0.2.0 ships full contract | `engines/unity/` exists, README current | ✓ |
| Godot SDK v0.2.0 ships full contract parity | `engines/godot/` exists, README current | ✓ |
| Both SDKs default to loopback-only | grep each README for "loopback-only by default" | ✓ |
| 9-primitive scenario format documented | `skills/playtest/scenarios/README.md` lists 9 types | ✓ |
| 6 reference scenarios validate | `gamestack-skill-lint` — `scenario/*` rules | ✓ |
| Daemon test drives a fake engine end-to-end | `cd bin/impl && bun test playtest-daemon/` → pass | ✓ |

## Multi-host

| Gate | Verify | Status |
|---|---|---|
| 9 hosts supported | `ls hosts/*.sh \| wc -l` → 10 (8 hosts + claude-code.sh + _lib.sh) | ✓ |
| Each host implements the contract | grep each for `gamestack_install`, `gamestack_uninstall`, `gamestack_status` | ✓ |
| `setup` skips underscore-prefixed scripts | `./setup --host _lib` → "reserved" error | ✓ |
| Adding a new host stays ≤15 lines | per-host script lengths under 20 lines (excluding `claude-code.sh`) | ✓ |

## Docs

| Gate | Verify | Status |
|---|---|---|
| README is launch-quality | `wc -w README.md` → ~2000+ | ✓ |
| `docs/skills.md` covers every skill | 38 `### `/skill-name`` headings in skills.md | ✓ |
| `docs/ROLES.md` cross-skill catalog | exists, ≥3000 words | ✓ |
| `docs/ENGINES.md` Unity + Godot reference | exists, ≥2400 words | ✓ |
| `docs/CERT.md` PS5/Xbox/Switch reference | exists, ≥2500 words | ✓ |
| `docs/ACCESSIBILITY.md` Top-4 + GAG | exists, ≥2000 words | ✓ |
| `docs/PLATFORMS.md` per-platform budgets | exists, mirrors `bin/impl/shared/platforms.ts` | ✓ |
| 5 howto tutorials at `docs/howto/` | `ls docs/howto/*.md \| wc -l` → 5 | ✓ |
| 2 case studies at `docs/case-studies/` | `ls docs/case-studies/*.md \| wc -l` → 2 | ✓ |
| `CHANGELOG.md` lists v1.0.0 | grep `## \[1.0.0\]` CHANGELOG.md | ✓ |
| All skill cross-links resolve | `gamestack-skill-lint` — `links/skill-target-exists` rule | ✓ |

## Conventions stay enforced

| Gate | Verify | Status |
|---|---|---|
| `/code-review-gamestack` keeps its suffix | grep `code-review-gamestack` in setup + README | ✓ |
| Don't auto-upload to console partner portals | grep CLIs for portal/cert upload | ✓ (none present) |
| Don't add new playtest scenario primitives without updating the spec | `gamestack-skill-lint` — `scenario/step-type-known` blocks this | ✓ |
| Don't put `README.md` inside `.claude/{skills,commands,agents}/` | `gamestack-skill-lint` — `claude/no-readme-in-claude-dirs` blocks this | ✓ |
| Don't introduce new runtime deps casually | `bin/impl/package.json` deps list is two: `image-size`, `@anthropic-ai/sdk` | ✓ |

## Known gaps at v1.0

| Gap | Plan |
|---|---|
| No live Unity / Godot project validation | The SDKs are validated against an in-process fake engine. First real game using them will surface engine-specific bugs. Track via issues; patch in v1.0.x as they're found. |
| Cursor plugin manifest forward-compat | `hosts/cursor.sh` symlinks like the other hosts. If Cursor's production plugin loader requires a per-skill manifest, the script will need an emit step. |
| Power tools are skills, not hooks | `/careful`, `/freeze`, etc. are behavioral skills Claude reads each turn. A Stop/PreToolUse hook implementation would enforce the discipline at the harness level. Pull request welcome. |
| No CI integration for engine-SDK self-tests | Unity TestRunner + Godot scene-attach tests are self-tests today. CI integration is post-v1. |
| No alliance studio games yet | The alliance studio scaffolding ships separately; once the first game is added, the SDKs will get their first real exercise. |

## Re-verification

```bash
cd /Users/kevinhanaford/Documents/workspace/gamestack

# 1. Skill + scenario lint must pass.
bin/gamestack-skill-lint --warn-as-error

# 2. CLI test suite must pass.
cd bin/impl && bun install && bun test

# 3. TypeScript must compile clean.
bunx tsc --noEmit

# 4. Setup must install cleanly to the default host.
cd ../.. && ./setup --status   # should show 38 skills linked
```

If any of those four fail, v1.0 has regressed — investigate before any subsequent release.

## Related

- [`CHANGELOG.md`](../CHANGELOG.md) — v1.0.0 release notes.
- [`docs/PLAN.md`](PLAN.md) — milestone-level plan.
- [`bin/impl/skill-lint/README.md`](../bin/impl/skill-lint/README.md) — what the validator catches.
- Every skill's `SKILL.md` — the source of truth this checklist guards.
