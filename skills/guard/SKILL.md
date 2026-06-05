---
name: guard
description: Power tool — combines [`/careful`](../careful/SKILL.md) (pause-before-destructive) and [`/freeze`](../freeze/SKILL.md) (restrict edits to a directory) in one switch. Standard setting for cert prep, hotfix branches, and any stretch where mistakes are expensive both in scope and in reversibility.
---

# guard

You are operating in GUARD mode — the standard high-stakes setting. Two disciplines stack at once:

1. **Pause before destructive operations** — the [`/careful`](../careful/SKILL.md) discipline.
2. **Refuse writes outside the frozen zone** — the [`/freeze`](../freeze/SKILL.md) discipline.

Both apply for the rest of the session.

## When to fire

Direct invocation: `/guard <path>` (where `<path>` is the freeze zone). If no path is given, ask which directory to guard around; default to the current working directory if the user confirms.

Trigger phrases that imply guard mode: "cert prep starts now", "this is the hotfix branch", "scope this change tightly".

Lift the two restrictions independently:
- [`/uncareful`](../careful/SKILL.md) — drop the destructive-op pause.
- [`/unfreeze`](../unfreeze/SKILL.md) — drop the write restriction.
- [`/unguard`](../guard/SKILL.md) (this skill) — drop both at once.

## Process

### Step 1 — announce both disciplines

```
GUARD — active.
  CAREFUL: pause before destructive ops; surface what's lost.
  FREEZE:  restricted to <path>.
```

### Step 2 — combine the two checks before every action

Before any tool call that writes to disk:
1. Is the target inside the frozen zone? If no, refuse with the FREEZE message (see [`/freeze`](../freeze/SKILL.md)).
2. Is the action destructive (delete / overwrite / force / drop / send)? If yes, run the CAREFUL pause (see [`/careful`](../careful/SKILL.md)) before executing.

A destructive action inside the frozen zone still requires the [`/careful`](../careful/SKILL.md) confirmation.

### Step 3 — don't merge confirmations

If a single user message asks for an edit AND a destructive op, surface them separately. The user can confirm both, but they should confirm each one with eyes on the consequences.

### Step 4 — keep reads cheap

Both disciplines leave reads alone. Investigate the rest of the repo freely.

## What NOT to do

- **Don't compress the [`/freeze`](../freeze/SKILL.md) and [`/careful`](../careful/SKILL.md) outputs into one terse message.** Each surfaces a different risk; combining them makes both easier to miss.
- **Don't suggest `--no-verify` or `--force` as a way through a CAREFUL gate.** Same rule as standalone [`/careful`](../careful/SKILL.md).
- **Don't quietly broaden the zone.** Same rule as standalone [`/freeze`](../freeze/SKILL.md).
- **Don't apply edits "as a workaround for the guard."** If the user wants guard off, they should say so.

## Handoff

- [`/unguard`](../guard/SKILL.md) — lift both disciplines.
- [`/cert-freeze`](../cert-freeze/SKILL.md) — opinionated guard for the build / cert directory.
- [`/launch-day`](../launch-day/SKILL.md) — strongest setting; guard + verbose logging on the actual ship day.
