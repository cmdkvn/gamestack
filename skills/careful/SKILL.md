---
name: careful
description: Power tool — pauses before destructive or hard-to-reverse operations. Surfaces what could be lost and asks for explicit confirmation. Use during cert prep, launch week, large refactors, or any high-stakes stretch where one undo-able mistake costs hours.
---

# careful

You are operating in CAREFUL mode. The user has flagged that the next stretch of work is high-stakes and reversibility matters more than speed. Treat the keyboard like it costs money to type on.

## When to fire

- Direct invocation: `/careful`
- Trigger phrases: "be careful", "go slow", "don't break anything", "this is the prod branch"
- Stays active for the rest of the session unless the user says `/uncareful` (or just "back to normal").

## The lens — what counts as destructive

| Category | Examples |
|---|---|
| **File system** | `rm`, `rm -rf`, redirecting `>` over an existing file, overwriting uncommitted changes, `git checkout -- <path>` |
| **Git** | `push --force`, `reset --hard`, `branch -D`, `clean -fd`, amending pushed commits, deleting tags, force-overwriting upstream |
| **Database / data store** | `DROP`, `TRUNCATE`, `DELETE` without a `WHERE` clause, schema migrations on prod |
| **Processes** | `kill -9` of long-running jobs, killing build / cert uploads mid-flight |
| **Cloud / shared** | Terminating instances, deleting cloud resources, revoking IAM, force-rotating keys others depend on |
| **Communications** | Pushing PRs, opening Issues, sending messages (Slack, Discord, email), posting to external services |
| **Stores / submissions** | Uploads to Steam, itch, console partner portals, App Store, Play Store |

If you're unsure whether something is destructive, treat it as destructive.

## Process

### Step 1 — name the action

In plain English, in 1–2 sentences:
- What you're about to do.
- Which file / branch / table / channel / instance is affected.

### Step 2 — surface the loss

In 1–3 bullets:
- What gets lost or changed and cannot be trivially restored.
- Who else is affected (if anyone).
- What the recovery cost would be if it goes wrong.

### Step 3 — ask once

Ask for confirmation with a single, unambiguous question. Accept `yes` / `go` / `confirm` as positive answers; treat anything else as a stop.

### Step 4 — execute or propose an alternative

- On confirmation: execute the action. Don't ask again about the same action.
- On stop or unclear answer: don't execute. Propose a less destructive alternative (dry run, smaller scope, branch instead of overwrite).

### Step 5 — re-arm for the next action

A confirmed action does NOT pre-confirm later destructive actions. Reset to Step 1 for each new destructive operation.

## Output format

```
CAREFUL — about to <action>.

Affects:
  - <thing>: <what changes>
  - <thing>: <what changes>

What's lost if this goes wrong:
  - <consequence>
  - <consequence>

Proceed? (yes / no / propose alternative)
```

## What NOT to do

- **Don't softball the risk.** "This will overwrite the file" beats "this may affect the file."
- **Don't ask for confirmation on non-destructive actions.** `/careful` is not "ask before every step." Reading files, running tests, running a benchmark, formatting code — none of that needs confirmation.
- **Don't bundle multiple destructive actions in one confirmation.** If you need to drop three tables, ask three times. The user might say yes to one and no to another.
- **Don't suggest `--no-verify`, `--force`, or `--no-gpg-sign` as a workaround when a check blocks you.** Investigate the check first.
- **Don't auto-retry a confirmed-and-failed destructive action.** If `git push --force` fails, surface the failure; don't re-attempt without the user.

## Handoff

- `/uncareful` — leave careful mode. Use after a stable patch lands or after the deploy window closes.
- [`/freeze`](../freeze/SKILL.md) — narrow the blast radius of EDITS to one directory. Pairs well with `/careful`.
- [`/guard`](../guard/SKILL.md) — `/careful` + `/freeze` together. Standard for cert prep and launch week.
- [`/cert-freeze`](../cert-freeze/SKILL.md) — opinionated `/freeze` for the build / cert directory during a cert run.
- [`/launch-day`](../launch-day/SKILL.md) — strongest setting; `/guard` plus verbose logging on the actual ship day.
