---
name: patch-notes
description: Technical Writer skill — reads the diff since the last release plus closed issues plus the project's tone notes, drafts player-facing patch notes (community-friendly), and writes a separate dev-facing changelog (terse and technical). Use after every patch and before posting an update to Steam / itch / consoles.
---

# patch-notes

This skill writes the patch notes that show up in the Steam News tab, the itch update post, and the in-game "What's New" prompt, and keeps the developer-facing changelog honest. Two distinct audiences, two distinct registers: players want to know what changed and why they should care; developers want to know what broke and what landed.

## When to fire

Use right after a release tag is cut and before posting the update publicly. Trigger phrases:
- "Write the patch notes"
- "Patch notes for v<X>"
- "Update the changelog"
- "What changed in this release?"
- `/patch-notes [tag-or-range]`

If [`/publish`](../publish/SKILL.md) has just run, the tag is already in `ROADMAP.md`. Use that as the source of truth for which range to summarize.

## The lens — two artifacts, two voices

### Player-facing patch notes

| Quality | Standard |
|---|---|
| **Tone** | Match the game's voice (cozy, dry, melodramatic). Don't borrow tone from another studio. |
| **Audience** | A player who hasn't read the dev's posts and may have stopped playing weeks ago. |
| **Headline** | What changed that they'll *feel*. Not "refactored audio mixer"; "background music no longer drops out during boss fights." |
| **Structure** | Headline categories (New / Improved / Fixed). Maybe a "Heads up" for anything intentional that might surprise them. |
| **Length** | Most patches: 5–15 lines. Major updates: 30–50 lines. Never longer. |
| **Honesty** | If something nerfed a strategy, say so. Don't paper over balance changes with corporate hedging. |
| **Localization** | Note which languages are updated; flag known gaps. |

### Dev-facing changelog

| Quality | Standard |
|---|---|
| **Tone** | Terse, technical, present tense. |
| **Audience** | Future-you, contributors, oncall. |
| **Structure** | Keep-a-Changelog format (`Added` / `Changed` / `Deprecated` / `Removed` / `Fixed` / `Security`). |
| **Coverage** | Every notable commit. PR # if available. |
| **Skip** | Reverts of unmerged WIP; cosmetic doc edits inside the same PR. |

## Process

### Step 1 — locate the range

- If [`/publish`](../publish/SKILL.md) just ran, use the new version's tag as `HEAD` and the previous tag as `BASE`.
- Otherwise: ask the developer for the range, or default to `BASE = last tag`, `HEAD = HEAD`.

### Step 2 — pull the inputs

Walk in this order; each provides different context:

| Input | What it tells you |
|---|---|
| `git log BASE..HEAD --oneline --no-merges` | What landed |
| `git log BASE..HEAD --shortstat` | Scope per commit (great for "major" vs "minor" classification) |
| Closed issues in the range (`gh issue list --search "closed:>BASE_DATE label:bug"`) | What players reported as broken |
| Closed PRs (`gh pr list --search "merged:>BASE_DATE"`) | What landed with descriptions |
| `playtest/playtest-*/run.json` from the range | Functional changes the dev exercised |
| `CHANGELOG.md` current top entry | The voice / format precedent |
| `design/voice-cards.md` (if present) | The game's tone for the player notes |
| `games/<name>/CLAUDE.md` | The phase and any tone overrides |

### Step 3 — classify each change

For each commit / PR / closed issue, assign:
1. **Audience:** player / dev-only / both.
2. **Bucket:** New / Improved / Fixed / Heads-up / Behind-the-scenes.
3. **Magnitude:** headline / detail / footnote.

Dev-only changes go straight to the changelog. Both-audience changes get two lines (player tone, dev tone).

### Step 4 — draft the player notes

- Open with one or two headline bullets — the things players will notice.
- Group remaining changes by bucket.
- Cut everything that can be cut. Brevity reads as confidence.
- For balance changes, name the affected strategy in plain words ("the bow-only run is a little harder now").
- Add a single "Heads up" if anything intentional might confuse returning players.

### Step 5 — draft the changelog entry

- Top-of-file under a `## [vX.Y.Z] - YYYY-MM-DD` heading.
- Standard Keep-a-Changelog buckets, sorted by impact.
- One line per change. Reference issue / PR numbers where they exist.

### Step 6 — write both artifacts

- Player notes to `marketing/patch-notes/vX.Y.Z.md`.
- Changelog entry prepended to `CHANGELOG.md`.

Open a PR (or surface a draft) for the developer to review before posting publicly.

## Output format

### Player notes

```markdown
# <Game Name> — vX.Y.Z

<One-paragraph headline: the headline change, in the game's voice.>

## New
- <bullet — player-noticeable thing>
- ...

## Improved
- ...

## Fixed
- ...

## Heads up
- ...

_<Localization note. Known issues. Thank-you line if it fits the tone.>_
```

### Changelog entry

```markdown
## [vX.Y.Z] - YYYY-MM-DD

### Added
- <one-liner>

### Changed
- ...

### Fixed
- <description> (#PR / #issue)

### Removed
- ...
```

## What NOT to do

- **Don't mix the two audiences in one document.** Players don't want to read "refactored audio mixer." Devs don't want "fans of bow runs may find them slightly more challenging."
- **Don't invent changes that didn't happen.** If the diff doesn't support a claim, cut it.
- **Don't bury intentional balance changes.** Players catch nerfs in hours; pretending otherwise loses trust.
- **Don't promise upcoming features in patch notes.** Save that for a separate roadmap post.
- **Don't translate yourself.** Surface the English drafts and flag the languages to localize. Skipping this skill's localization note has burned previous releases.
- **Don't post anything yet.** This skill drafts. The developer posts.

## Handoff

- [`/publish`](../publish/SKILL.md) — cuts the version that this skill summarizes.
- [`/post-mortem`](../post-mortem/SKILL.md) — when the patch fixes a release-time incident, link to the post-mortem from the dev-side changelog.
- [`/post-launch-monitor`](../post-launch-monitor/SKILL.md) — watch sentiment after the notes go live; if a "Heads up" gets flagged, plan the follow-up.
- [`/learn`](../learn/SKILL.md) — record any voice / format decisions made during this round so the next patch starts from them.
