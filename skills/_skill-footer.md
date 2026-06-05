# Skill output footer convention

Every skill ends its visible output with a one-line footer so the developer can tell which version of the skill produced the artifact, and so stale advice surfaces visibly when the gamestack checkout drifts behind the latest skill content.

This file is **not a skill** — it's a shared convention that other SKILL.md files reference.

## The footer

Print this as the final line of every skill's visible output (the part the developer sees in chat — *not* into the artifact file unless it makes sense there):

```
— gamestack v<VERSION> · /<skill-name>[--lens=<lens>] · <YYYY-MM-DD>
```

Where:

- `<VERSION>` is the content of the `VERSION` file at the repo root. If you cannot read it, print `unknown` rather than fabricating a number.
- `<skill-name>` is the name from the skill's frontmatter.
- `<lens>` is the lens flag (only present for `/critique`).
- `<YYYY-MM-DD>` is today's date.

Example:
```
— gamestack v1.0.0 · /critique --lens=fun · 2026-06-05
```

## Why

Two reasons:

1. **Drift detection.** A user running an 18-month-old skill against the latest engine version will hit confidently-wrong advice. The footer makes the version visible at the point of consumption rather than hidden in install metadata.
2. **Skill-feedback attribution.** When `/skill-feedback` writes a `not-useful` entry, the version field tells the maintainer whether the rating is against current content or against an old version that's already been rewritten.

## Drift check (developer-facing)

Developers can run `./setup --check-updates` from the gamestack checkout. The script compares the current commit hash to `origin/main` and prints a one-line status. It does not call out to any third-party server.

## What NOT to do

- **Don't print the footer inside the artifact file.** Artifacts live in the project repo (`design/pitch.md`, `playtest/critique-*.md`) and serve other readers; the footer is a chat-output convention.
- **Don't fabricate a version.** If the VERSION file is unreadable, say `unknown` — never make up a number.
- **Don't omit the footer on `bailed` runs.** The whole point is provenance; a bailed run with no footer is invisible to skill-feedback aggregation.
