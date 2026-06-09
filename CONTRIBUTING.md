# Contributing to gamestack

gamestack turns your AI coding agent into a coordinated set of game-dev specialists. The single most valuable contribution is **using gamestack on a real game and logging skill-feedback honestly** — that's what drives the next rewrite. PRs are welcome too; conventions below.

For the user-facing pitch, see [README.md](README.md). For the philosophy ("honest over flattering", "menu not path"), see [README.md#philosophy](README.md#philosophy).

## How to file an issue

| Type | Where |
|---|---|
| **Bug in a skill** — wrong output, crash, didn't fire when it should | [GitHub Issues](https://github.com/cmdkvn/gamestack/issues), tag `bug` |
| **Skill drift** — output was unhelpful or wrong-headed | First run `/skill-feedback - <skill>` to log it locally. Then file an issue with the aggregated log (`gamestack-skill-feedback --format=json`) attached |
| **New skill or CLI proposal** | Open an issue tagged `proposal`. Include: which phase of the Pitch → Plan → Build → Review → Playtest → Ship → Reflect pipeline it belongs to, who it serves, what makes it solo-viable |
| **Engine SDK bug** | Tag `engine-sdk` and identify the engine. Include the gamestack version, engine version, and a minimal repro if possible |
| **Security issue** | See [SECURITY.md](SECURITY.md) — do NOT file as a public issue |

## How PRs are accepted

Every PR must:

1. **Pass `bin/gamestack-skill-lint --warn-as-error`.** This catches frontmatter drift, dead cross-links, and skill-structure regressions. CI runs it; you should run it locally first.
2. **Pass `bun test`** in any `bin/impl/<cli>/` package you touched.
3. **Pass CI** on the `ci.yml` workflow.
4. **Respect the voice.** Skills push back. PRs that soften "honest > flattering" or add cheerful filler will get pushback in review.
5. **Stay scoped.** One skill or one concern per PR. The catalog is large; mixed PRs are hard to revert when a single skill regresses.

## Skill development

Conventions live in [`.claude/CLAUDE.md`](.claude/CLAUDE.md) (which is read by Claude Code when working inside this repo). Summary:

- Skills are markdown files with YAML frontmatter (`name`, `description`). Both fields matter — `description` drives Claude's skill-selection.
- Skills are **self-contained**; don't depend on other gamestack skills.
- Skill content is **prompt context** for Claude when the skill fires. Be precise about: when to use, the process to follow, what NOT to do, and the output format.
- New skills must be linked from [README.md](README.md) and [docs/skills.md](docs/skills.md).
- Output schemas live in [`docs/templates/`](docs/templates/) — link to them from the skill rather than inlining the format.

## Testing locally

| Want to check... | Run this |
|---|---|
| Skill frontmatter, cross-links, sections | `bin/gamestack-skill-lint --warn-as-error` |
| A CLI's behavior | `cd bin/impl/<cli> && bun test` |
| Symlink integrity after `./setup` | `./setup --status` |
| Setup script idempotency | `bash tests/setup-sync.test.sh` |

Behavioral skill tests (scenario fixtures + a runner) are planned — see [docs/PLAN.md](docs/PLAN.md). Until then, skills are validated by reading them and trying them.

## Commit format

Follow the existing convention (e.g., `feat(setup): plan-first sync`, `docs: sync state across catalog`):

```
<type>(<scope>): <subject>

<body — explain the why, not the what>

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
```

Types: `feat`, `fix`, `docs`, `chore`, `ci`, `refactor`. Scopes are loose — use what makes the PR navigable.

## Code of conduct

Be honest. Be specific. Push back on bad ideas — including your own. There is no separate code-of-conduct document yet; that's a follow-up if the community grows.
