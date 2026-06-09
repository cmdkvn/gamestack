---
name: post-mortem
description: Eng Manager skill — runs a weekly per-project retro or a deeper post-launch retro. Reads the week's diff, closed issues, playtest reports, and any [`gamestack-post-launch-monitor`](../post-launch-monitor/SKILL.md) digest, then produces a blameless write-up: what shipped, what slipped, what we got wrong, and what we're doing differently. Use weekly during production and within 7 days of every launch.
---

# post-mortem

This skill runs a retro — weekly during production or post-launch — and produces a blameless write-up of what shipped, what slipped, what was got wrong, and what's changing. It keeps the writing-things-down discipline alive in a one-person studio. A post-mortem in a solo studio is not corporate ritual; it's how the developer learns from themselves.

## When to fire

Two cadences:

| Cadence | When |
|---|---|
| **Weekly retro** | Every Friday afternoon during Production / Polish / Live-Ops phases. |
| **Launch post-mortem** | Within 7 days of every launch (`Launched` phase transition). |

Trigger phrases:
- "Run a post-mortem"
- "Weekly retro"
- "Write the launch post-mortem"
- `/post-mortem [weekly | launch]`

If the developer hasn't run one in 30+ days during Production, surface that gently and offer to run one.

## The lens — blameless, specific, actionable

Three rules, in order:

1. **Blameless.** "What was the system that led to this?" not "What was the person thinking?" In a solo studio, those collapse into the same person — that's exactly when this discipline matters most.
2. **Specific.** "Build size jumped 240 MB because the LFS migration didn't update `.gitattributes`" not "asset issues."
3. **Actionable.** Every "what went wrong" gets a paired "what we'll do differently" that the developer could start tomorrow.

## Process

### Step 1 — pick the window

| Retro type | Window |
|---|---|
| Weekly | Last 7 days from today. |
| Launch | Cert-pass through 7 days post-launch (so post-launch monitoring data is part of the input). |

State the window explicitly at the top of the retro.

### Step 2 — pull the inputs

| Input | What it tells you |
|---|---|
| `git log <since>..HEAD --shortstat` | What shipped |
| `git log --since=<since> --oneline --no-merges` | Granularity of the week's work |
| Closed and merged PRs in the window | What landed |
| `playtest/playtest-*/run.json` from the window | What was exercised; any timeouts / fails |
| `playtest/critique-perf-*.md` newer than the prior retro | Perf regressions or improvements |
| `playtest/cert-readiness/*.json` (cert phase only) | Cert state changes |
| `playtest/post-launch-monitor/*.json` (launched only) | Sentiment, crashes, refunds |
| `CHANGELOG.md` top entry | What the developer publicly claimed shipped |
| `ROADMAP.md` items planned for the window | What was supposed to ship |
| `design/*.md` modified in the window | Direction shifts |

### Step 3 — categorize the week

For a weekly retro, classify into:

| Bucket | Quality of evidence |
|---|---|
| **Shipped** | Merged + verified (tests / playtest / live data). |
| **Started but didn't land** | WIP branches, draft PRs, design docs in progress. |
| **Planned but didn't start** | Roadmap items untouched. |
| **Discovered** | Bugs found / issues filed during the window. |
| **Surprised by** | Things that were harder, easier, or different than expected. |

For a launch retro, swap Shipped/Started/Planned for:

| Launch bucket | What it captures |
|---|---|
| **What went well** | Specific moments that worked. |
| **What went poorly** | Specific moments that didn't. |
| **Lucky escapes** | Things that nearly went badly. Treat as "what went poorly" — luck isn't a process. |
| **Player reception** | First-72h sentiment from [`/post-launch-monitor`](../post-launch-monitor/SKILL.md). |
| **Surprises** | Things you didn't anticipate at all. |

### Step 4 — pair every "wrong" with a "differently"

For every item in "Started but didn't land", "Planned but didn't start", "What went poorly", and "Lucky escapes":

- **Root cause** (or best-current-hypothesis): one sentence.
- **What we'll do differently**: one concrete action the developer could start tomorrow. Not "be better at scoping" — "split next sprint's items at 2-day increments and re-evaluate scope at day 3."

If you don't know the root cause yet, name an **investigation step** instead of a fake fix.

### Step 5 — note the wins

Solo retros that read as a list of failures are demoralizing and unsustainable. Always include:
- 2–4 things that worked (specific, not "general progress").
- One **earned skill** — what got easier this week.

### Step 6 — write the report

To `studio/retros/YYYY-WW.md` (weekly) or `studio/retros/launch-<game>-YYYY-MM-DD.md` (launch).

### Step 7 — surface learnings to memory

The 2–3 most generalizable lessons get piped into [`/learn`](../learn/SKILL.md) so future sessions inherit them. The retro file is the long form; [`/learn`](../learn/SKILL.md) is the recall surface.

## Output format

**Output:** writes to `studio/retros/YYYY-WW.md` (weekly) or `studio/retros/launch-<game>-YYYY-MM-DD.md` (launch) — schema: see [`docs/templates/post-mortem.md`](../../docs/templates/post-mortem.md).

## What NOT to do

- **Don't write "general progress" as a retro item.** If you can't name a specific commit / PR / bug / decision, the item probably doesn't belong.
- **Don't write a retro that reads as self-flagellation.** Pair every "wrong" with a "differently" and always include wins.
- **Don't skip the launch retro just because the launch went well.** Lucky escapes hide the next launch's failure.
- **Don't combine multiple weeks into one retro.** The weekly cadence is what makes the lessons fresh enough to remember.
- **Don't auto-apply the "differently" actions.** Surface them; the developer decides which ones land where.

## Handoff

- [`/learn`](../learn/SKILL.md) — generalizable lessons get persisted across sessions.
- [`/patch-notes`](../patch-notes/SKILL.md) — launch retros sometimes reveal a follow-up patch worth shipping immediately.
- [`/post-launch-monitor`](../post-launch-monitor/SKILL.md) — launch retros pull from its digest.
- [`/plan-game-design`](../plan-game-design/SKILL.md) (or the relevant plan-* skill) — when the retro surfaces a design assumption that needs revisiting.
