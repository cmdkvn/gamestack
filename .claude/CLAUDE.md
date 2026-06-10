# gamestack — repo-internal AI instructions

This file applies when Claude Code is started inside the gamestack repo itself (for dogfooding development on gamestack). It does NOT apply when gamestack is installed and used by end users — those users get the individual skill SKILL.md files.

## What gamestack is

A Claude Code skill collection that gives solo indie game devs an AI-mediated game studio. Skills simulate roles (Creative Director, Game Designer, Narrative Designer, etc.) and run as a sprint: **Pitch → Plan → Build → Review → Playtest → Ship → Reflect**.

See [README.md](../README.md) for the user-facing pitch.

## Repository structure

```
gamestack/
├── setup                          # install script (entry point for users)
├── skills/<name>/SKILL.md         # skill definitions — the meat of the project
├── hosts/<name>.sh                # per-AI-agent host install logic
├── engines/<unity|godot>/         # engine SDKs (post-M0)
├── bin/                           # standalone CLIs (post-M0)
├── docs/                          # deep-dive references
└── .claude/                       # this file + repo dev settings
```

## When editing skills

1. Skills are markdown files with YAML frontmatter (`name`, `description`). Both fields matter:
   - `name` is the slash-command name and the discovery key for same-name overrides.
   - `description` is read by Claude's skill-selection mechanism. Keep it specific. Lead with the verbs the user would type.
2. Skills shouldn't import / depend on other gamestack skills — each is self-contained markdown.
3. Skill content is prompt context for Claude when the skill fires. Be precise about: when to use, the process to follow, what NOT to do, and the output format.
4. Test a skill by symlinking it into `~/.claude/skills/<name>/` and opening a fresh Claude Code session that would naturally trigger it.

## Conventions

- **Naming:** skill directories and SKILL.md files in kebab-case. Match the slash-command name.
- **Engine-agnostic by default:** when a skill is engine-specific, detect the engine first; otherwise stay portable.
- **No emojis** in skill content unless the user is going to see them in a deliberate UI moment.
- **Be skeptical, not flattering** in the voice of each skill. Skills are senior practitioners, not cheerleaders.
- **Test changes against the dogfood install:** if you've edited a skill, the symlinked install picks it up live — confirm Claude can still invoke it correctly.
- **Dogfood lint hook:** `gamestack-skill-lint --warn-as-error` re-runs automatically (PostToolUse hook in `.claude/settings.json` → `bin/impl/skill-lint/validate-skill-change.sh`) when Claude edits a `skills/*/SKILL.md` or a `docs/templates/*.md`. Drift surfaces in-loop rather than waiting for CI. Requires `jq` (see [`CONTRIBUTING.md`](../CONTRIBUTING.md)).

## When developing a new skill

1. Read [`../README.md`](../README.md) and [`../docs/skills.md`](../docs/skills.md) to see how shipped skills present themselves — voice, structure, when-to-fire framing.
2. Pattern-match against the closest already-shipped skill in `skills/<closest>/SKILL.md`. Keep voice and shape consistent across the catalog.
3. Decide which phase of the Pitch → Plan → Build → Review → Playtest → Ship → Reflect pipeline the skill belongs to; add it to the right table in `README.md` and add a deep-dive entry in `docs/skills.md`.
4. Iterate on the prompt content until invoking the skill produces useful results across at least 3 example scenarios.
5. Run `bin/gamestack-skill-lint --warn-as-error` to validate frontmatter and link integrity before opening a PR.

## Reference

- [gstack](https://github.com/garrytan/gstack) — the inspiration. Read its skill content for prompt-engineering patterns.
- [Claude Code skills docs](https://code.claude.com/docs/en/skills) — the discovery and override mechanics.
