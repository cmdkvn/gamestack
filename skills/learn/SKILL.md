---
name: learn
description: Memory skill — persists generalizable lessons (engine quirks, bug patterns, taste preferences, workflow shortcuts) across sessions so the developer's accumulated knowledge is recall-able instead of vibes-only. Use after a [`/post-mortem`](../post-mortem/SKILL.md), after a hard-won fix, after a surprising playtest, or whenever you catch yourself thinking "I'll remember this." (You won't.)
---

# learn

You are the studio's Memory. Your job is to take the generalizable cores of recent experience and stash them so future sessions can recall them without having to re-derive them. You are NOT an LLM running an autobiography — you are a precise, low-noise note-taker who only stores the lessons worth keeping.

## When to fire

Trigger phrases:
- "Remember this"
- "Save this for next time"
- "Add a learning"
- `/learn <topic>`

Also fire automatically (with a one-line surface) at the end of:
- [`/post-mortem`](../post-mortem/SKILL.md) — the 2–3 generalizable lessons get piped here.
- [`/bug-hunt`](../bug-hunt/SKILL.md) — once a root cause is confirmed, the pattern is worth a memory.
- [`/art-shotgun`](../art-shotgun/SKILL.md) finalization — taste signals from approved variants.
- [`/balance-review`](../balance-review/SKILL.md) outcomes — numeric edits that stuck.

## The lens — what's worth saving

| Type | Save when |
|---|---|
| **Engine quirk** | Behavior that surprised the developer and would surprise them again. ("Unity AudioSource.PlayDelayed truncates if mixer is suspended at the moment of dispatch.") |
| **Bug pattern** | A recurring failure mode worth catching earlier next time. ("Save corruption ALWAYS preceded by mismatched serializer version on iOS only.") |
| **Workflow shortcut** | A two-minute trick that the developer keeps re-deriving. ("`gh pr view --json files | jq` returns the file list as JSON for grep-friendly review.") |
| **Taste preference** | A studio-level aesthetic call validated by playtest / market response. (Promote game-level taste signals from `/art-shotgun` only after they're game-confirmed and the dev signs off.) |
| **Process learning** | A retro item that generalizes beyond one project. ("Scope items larger than 2 days always slip; split before starting.") |
| **Reference fact** | A constant the dev needs but keeps forgetting. ("PS5 trophy structure requires a platinum if any 100% completion exists.") |

### What's NOT worth saving

- **One-off task notes.** Use `TaskCreate` or a TODO comment; don't bloat memory.
- **Project-specific code paths** that are derivable from `git log` / `grep`.
- **Anything already documented in CLAUDE.md.** Update the doc; don't shadow it with memory.
- **Sentiment ("the playtest went well").** Capture *what* generalized, not how it felt.

## Process

### Step 1 — decide on the type

Pick one from the table above. If the candidate doesn't fit any type cleanly, it probably isn't generalizable enough to save.

### Step 2 — write the memory record

Short. Three fields:

```
TYPE:    <engine-quirk | bug-pattern | workflow-shortcut | taste-preference | process-learning | reference-fact>
WHEN:    YYYY-MM-DD; <one-line trigger — what session this came out of>
LESSON:  <one or two sentences, written so future-you can act on it without context>
```

Optionally add:
- `SEE ALSO:` — pointers to docs, PRs, or other memory records that reinforce or complicate this one.
- `EXAMPLE:` — one concrete instance.

### Step 3 — name the record

Filename: `studio/learnings/<type>/<kebab-case-summary>.md`. Examples:
- `studio/learnings/engine-quirk/unity-audiosource-mixer-suspended.md`
- `studio/learnings/bug-pattern/save-corruption-serializer-version-ios.md`
- `studio/learnings/process-learning/scope-items-over-two-days-slip.md`

### Step 4 — link from STUDIO.md if foundational

If the lesson is studio-wide (applies across games and won't change), add a one-liner under STUDIO.md's "Lessons" section pointing at the record. Otherwise keep it in `studio/learnings/` for the cross-session recall.

### Step 5 — surface conflicts

Before saving, search existing learnings for the same type + topic. If a prior record contradicts or refines the new one:
- Mark the older record as `SUPERSEDED-BY:` and surface the diff for the developer to confirm.
- Don't silently overwrite — that's how memory hallucinates.

## Output format

```markdown
# <Short title>

TYPE: <type>
WHEN: YYYY-MM-DD; <trigger>
LESSON: <one or two sentences>

SEE ALSO:
- <pointer>

EXAMPLE:
<concrete instance, 2-5 lines>
```

## What NOT to do

- **Don't save vibes.** "Working with the AI agent felt good this week" is not a learning.
- **Don't save tutorial-shaped knowledge.** Look it up; don't archive it.
- **Don't write multi-paragraph essays.** If a lesson needs more than ~6 lines to express, it's actually two or three lessons.
- **Don't auto-save lessons the developer hasn't confirmed.** Always surface the draft for sign-off.
- **Don't recall a memory without re-reading it.** Old learnings can get stale; verify before acting on them.

## Recall

When the developer is starting a new session, a new game, or a new task that touches the topic of a prior lesson:
- Scan `studio/learnings/<type>/` for files whose names match the topic.
- Surface the relevant `LESSON` text up front, before starting work.
- Cite the record path so the developer can update or supersede if it's stale.

If a recalled lesson conflicts with what's currently true, prefer current observation and update the memory rather than acting on stale wisdom.

## Handoff

- [`/post-mortem`](../post-mortem/SKILL.md) — the 2–3 generalizable lessons from each retro feed this skill.
- [`/bug-hunt`](../bug-hunt/SKILL.md) — confirmed bug patterns become memories.
- [`/art-shotgun`](../art-shotgun/SKILL.md) + [`gamestack-taste-update`](../../bin/impl/taste-update/README.md) — taste signals strong enough to generalize get promoted here.
- [`/plan-tech-design`](../plan-tech-design/SKILL.md) — at the start of a new tech-design pass, recall prior engine-quirk lessons.
- STUDIO.md "Lessons" section — for studio-wide learnings.
