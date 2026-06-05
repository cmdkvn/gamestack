---
name: skill-feedback
description: Quality-signal skill. Captures the developer's "was the last skill output useful?" thumbs-up/down to `.gamestack/skill-feedback.jsonl` for later aggregation by the `gamestack-skill-feedback` CLI. Use immediately after any other skill produces output, or as a session-end sweep across recent runs. Without this, gamestack can't tell which skills are landing and which are drifting.
---

# skill-feedback

gamestack has no improvement loop without this. The skill catalog evolves over time — rubrics get tightened, prompts get rewritten, dead lenses get cut. The signal for what to rewrite first comes from one place: did the developer find this output useful or not? This skill captures that signal.

The data stays **local**. Nothing is transmitted. See [`../../README.md#privacy`](../../README.md#privacy).

## When to fire

Use when the developer says any of:
- "That last skill was useful / not useful."
- "Log my feedback."
- "Rate that."
- `/skill-feedback [+|-] [skill-name]`
- At the end of any skill, the producing skill *may* prompt: "Was this useful?" — if the developer answers, this skill records it.

Don't fire automatically without the developer's input. Silent rating is worse than no rating.

## Process

### Step 1 — locate the project

Find `gamestack/state.json` per [`../_state-conventions.md`](../_state-conventions.md). If absent, fall back to capturing into `$HOME/.gamestack/skill-feedback.jsonl` and note that this entry won't roll up into any specific project.

### Step 2 — identify which skill is being rated

Order of resolution:
1. **Explicit arg.** `/skill-feedback + critique` or `/skill-feedback - publish`.
2. **Most recent `recent_runs` entry** from state.json. If it's < 2 hours old, assume this is the one being rated. Confirm with the developer first: "Rating the last run of `/<skill>`?"
3. **Ask the developer** which skill they want to rate.

### Step 3 — capture the rating

Three fields:
- **Verdict**: `useful`, `not-useful`, `mixed`, or `bailed-on-me`. (Map `+` → `useful`, `-` → `not-useful`.)
- **Reason**: one sentence from the developer. Optional but encouraged — without a reason, the rating is much less actionable later.
- **Tags** (optional): free-form keywords the developer chooses. Common: `wrong-engine-advice`, `too-long`, `right-but-obvious`, `surprising-insight`, `wrong-phase`, `auto-fix-broke-things`, `voice-drift`.

Don't pile extra questions on the developer. If they only give a verdict, that's fine — log it.

### Step 4 — append to the log

Append one JSON line to `<project>/.gamestack/skill-feedback.jsonl`:

```json
{"at":"2026-06-05T14:22:11Z","skill":"critique","lens":"fun","verdict":"useful","reason":"caught the dead mechanic I'd been defending for two weeks","tags":["surprising-insight"],"run_at":"2026-06-05T14:10:33Z","gamestack_version":"1.0.0"}
```

`run_at` should be sourced from the matching `recent_runs` entry when possible. If the entry can't be located, omit the field.

The file is **append-only**. Never rewrite. Aggregation happens out-of-band via the CLI.

### Step 5 — confirm + suggest next

Echo a one-line confirmation: `✓ logged: <skill> [<lens>] = <verdict>`.

If the developer just flagged something `not-useful`, ask if they want to drop a note for the maintainer. If yes, append it to `.gamestack/skill-feedback-notes.md` (separate file, free-form prose).

## Aggregation

This skill writes; it does not aggregate. To see per-skill thumbs-up rates, run:

```bash
gamestack-skill-feedback --window=30d
```

The CLI's behavior is documented at [`../../bin/impl/skill-feedback/README.md`](../../bin/impl/skill-feedback/README.md). Briefly: it reads every `.jsonl` it can find under the project (and optionally `~/.gamestack/skill-feedback.jsonl`), groups by skill, and reports useful-rate per skill plus the most common reasons for `not-useful`.

The output of the CLI is the list of skills the maintainer should rewrite first.

## What NOT to do

- **Don't rate skills the developer didn't ask you to rate.** Inferring a thumbs-down from a frustrated message is overreach.
- **Don't transmit the log.** Local-only. No telemetry. If the developer wants to share findings with the maintainer, they can attach the file manually to a GitHub issue.
- **Don't keep asking for more detail.** One sentence of reason is plenty.
- **Don't aggregate inline.** Aggregation is the CLI's job. This skill writes one entry per invocation.
- **Don't overwrite the log.** Append only. If the schema changes in a future version, write a migration step in the CLI, not in this skill.

## Handoff

After `/skill-feedback`:
- Continue whatever the developer was doing. The point is to capture signal cheaply, not to interrupt flow.
- `gamestack-skill-feedback --window=30d` (out-of-band) — review aggregates when the developer is curious.
- Maintainer-side: per the docs, run `gamestack-skill-feedback --format=json --out=feedback.json` then propose rewrites for the lowest-rated skills.
