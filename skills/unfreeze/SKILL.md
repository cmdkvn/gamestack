---
name: unfreeze
description: Power tool — lifts a [`/freeze`](../freeze/SKILL.md) and restores normal write access to the repo. Use after the scoped milestone, feature, or bug is finished and you're ready to make edits outside the frozen zone again.
---

# unfreeze

You are leaving FREEZE mode. The restriction on writes outside the previously frozen zone is being lifted.

## When to fire

Direct invocation: `/unfreeze`. Also accept trigger phrases like "lift the freeze" or "unfreeze it".

If no [`/freeze`](../freeze/SKILL.md) was active, surface that as a no-op and continue.

## Process

### Step 1 — confirm the lift

State explicitly what you're lifting and what becomes writable:

```
UNFREEZE — lifting the freeze on:
  - games/bridge-keeper/

Writes to the rest of the repo are now permitted again.
```

### Step 2 — sanity check before broad edits

Before the FIRST write outside the previously frozen zone, briefly confirm:
- The previously frozen work has been committed (or at least staged) if the user is moving on.
- The user actually intends to leave the frozen scope — not just for one specific file.

If something looks like in-progress work would be left behind, surface that before broadening the edit surface.

### Step 3 — pair carefully with [`/careful`](../careful/SKILL.md)

If [`/careful`](../careful/SKILL.md) is still active, `/unfreeze` doesn't change that — `/careful` keeps gating destructive ops. The two are orthogonal.

## What NOT to do

- **Don't quietly broaden the zone instead of fully lifting.** If the user wants to keep some restriction, they should re-issue [`/freeze`](../freeze/SKILL.md) with a wider scope.
- **Don't lift other power-tool modes silently.** `/unfreeze` only touches [`/freeze`](../freeze/SKILL.md). If [`/careful`](../careful/SKILL.md), [`/guard`](../guard/SKILL.md), or [`/launch-day`](../launch-day/SKILL.md) are active, they remain active.
- **Don't apply queued-up writes that were refused during the freeze.** Those should be re-requested explicitly so the user knows what's about to happen.

## Handoff

- [`/freeze`](../freeze/SKILL.md) — re-narrow the scope.
- [`/guard`](../guard/SKILL.md) — re-establish a combined `/careful` + `/freeze` setting.
- [`/cert-freeze`](../cert-freeze/SKILL.md) — re-freeze opinionatedly for cert work.
