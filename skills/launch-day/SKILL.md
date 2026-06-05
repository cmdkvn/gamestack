---
name: launch-day
description: Power tool — strongest discipline setting. Stacks [`/guard`](../guard/SKILL.md) ([`/careful`](../careful/SKILL.md) + [`/freeze`](../freeze/SKILL.md)) with verbose action logging and a one-line "what could go wrong" surfaced before every meaningful action. Use only on the actual ship day, when something visible to players is about to change.
---

# launch-day

You are operating in LAUNCH-DAY mode. The user is shipping today. Mistakes today are public, expensive, and stressful to recover from. This skill stacks every safeguard the gamestack power tools provide:

1. **Pause before destructive operations** ([`/careful`](../careful/SKILL.md))
2. **Restrict writes to the launch-affecting zone** ([`/freeze`](../freeze/SKILL.md))
3. **Log every meaningful action verbosely** (state intent before, summarize result after)
4. **Surface "what could go wrong" for every write** (one line, not a paragraph)

Treat speed as the second-most-important variable today. Reversibility is first.

## When to fire

- Direct invocation: `/launch-day`. Default freeze zone is the union of:
  - `build/`, `Builds/`, `dist/`
  - `marketing/steam/`
  - `playtest/post-launch-monitor/`
  - `ROADMAP.md`, `CHANGELOG.md`, `README.md`
- With argument: `/launch-day <path>` overrides.

Stays active until `/post-launch` (the calm has resumed) or the user invokes [`/unfreeze`](../unfreeze/SKILL.md) + [`/uncareful`](../careful/SKILL.md) explicitly.

## Process

### Step 1 — pre-flight ritual

Surface, once at session start:

```
LAUNCH-DAY — active.
  CAREFUL: on
  FREEZE:  <list of paths>
  LOG:     verbose (intent before, result after, every write)

Pre-flight check:
  - Latest cert: <pass / N/A>
  - Latest gamestack-cert-checklist: <date and verdict>
  - Latest gamestack-steam-page-check: <date and verdict>
  - Latest playtest run: <date>
  - Outstanding TODOs in launch-affecting code: <count>
```

If any of those look stale (older than 7 days), call it out explicitly. Don't ship blind.

### Step 2 — verbose intent before each write

Before every Write / Edit / Bash-that-writes:

```
LAUNCH-DAY — about to <verb> <target>.
Why now: <one sentence>.
What could go wrong: <one line — concrete failure mode, not vague>.
Roll-back if it does: <one line — exact recovery step>.
```

This is not optional. It's the discipline.

### Step 3 — verbose result after each write

Right after the write:

```
LAUNCH-DAY — <verb> <target> done.
Verified: <one line — what you observed that confirms success>.
```

If verification isn't possible right now (e.g., a build is uploading), say so explicitly and surface what would verify it later.

### Step 4 — extra gate around store-affecting ops

Steam page updates, console submissions, store listing changes, social posts — these are public-visible launch ops. Each one gets:
- The standard [`/careful`](../careful/SKILL.md) gate.
- An additional "is the rest of launch ready for this?" pause. (Posting the launch tweet 30 minutes before the build is live is a classic mistake.)

### Step 5 — surface the post-launch handoff at the end

Before closing the session, leave the user with:
- A list of what was shipped (with timestamps).
- The launch-day version tag (semver from [`/publish`](../publish/SKILL.md)).
- The recommended `gamestack-post-launch-monitor` cadence (default: daily for first 30 days, weekly after).

## What NOT to do

- **Don't push to main without all gates passing.** [`/careful`](../careful/SKILL.md) gates apply. Cert pass + Steam page launch-ready + tests green are the minimum.
- **Don't suggest `--no-verify`, `--force`, or `--no-gpg-sign`.** Today of all days.
- **Don't combine multiple store-facing publishes.** One platform at a time, verified before moving to the next.
- **Don't lift `/launch-day` mid-session.** If the user really wants it off, they should issue `/post-launch` (which moves the project phase forward) — anything else is a foot-gun.
- **Don't fabricate "verified" claims.** If you can't observe the result, say so.

## Handoff

- `/post-launch` — when the dust settles. Drops all the launch-day disciplines and moves the project's CLAUDE.md phase to **Launched**.
- [`/post-launch-monitor`](../post-launch-monitor/SKILL.md) — daily Live Ops digest.
- [`/uncareful`](../careful/SKILL.md), [`/unfreeze`](../unfreeze/SKILL.md), [`/unguard`](../guard/SKILL.md) — only if the user explicitly wants one discipline dropped while keeping the others.
