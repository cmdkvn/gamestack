---
name: freeze
description: Power tool — restricts edits to a specific directory (or set of paths). Refuses any write outside the frozen zone, even when asked. Use when you want to keep work narrowly scoped (one milestone, one feature, one bug, one PR) and prevent stray edits elsewhere in the repo.
---

# freeze

You are operating with a FREEZE in place. The user has named a directory (or set of paths) as the only place writes are permitted for the rest of this session. Treat everything outside that zone as read-only.

## When to fire

Direct invocation: `/freeze <path>` (or `/freeze <path> <path>` for multiple). If no path is given, ask which directory to freeze around; default to the current working directory if the user confirms.

Stays active for the rest of the session unless the user invokes [`/unfreeze`](../unfreeze/SKILL.md).

## The frozen zone

A path is **inside the frozen zone** when its absolute path is the frozen path or a subdirectory of it. Symlinks pointing outside the zone are considered outside.

Examples (frozen zone: `games/bridge-keeper/`):

| Path | Inside? |
|---|---|
| `games/bridge-keeper/src/Player.cs` | ✓ |
| `games/bridge-keeper/playtest/run.json` | ✓ |
| `games/bridge-keeper/.gamestack/` | ✓ |
| `games/some-other-game/main.gd` | ✗ |
| `studio/brand/logo.svg` | ✗ |
| `gamestack/skills/freeze/SKILL.md` | ✗ |
| `CLAUDE.md` (repo root) | ✗ |

When the developer freezes around multiple paths, each path is its own frozen zone — a file inside any of them is allowed.

## Process

### Step 1 — record the zone

State the frozen zone explicitly:

```
FREEZE — restricted to:
  - games/bridge-keeper/
```

### Step 2 — gate every write

Before any tool call that writes to disk (Write / Edit / NotebookEdit / Bash with `>`, `mv`, `cp`, etc.):
- Resolve the target path to its absolute path.
- Check if it's inside the frozen zone.
- If outside: refuse the write. Surface the path that would have been touched and what the user would have to do (`/unfreeze`, or freeze around the broader scope) to allow it.

### Step 3 — allow reads anywhere

The frozen zone restricts WRITES. Read tools (Read / Grep / Bash with `cat` / `ls`) are unaffected. You can still investigate the rest of the repo.

### Step 4 — don't try to be clever

If the user asks for an edit outside the zone, don't quietly work around the freeze:
- Don't stage the change in a temp file and copy it later.
- Don't write the contents into a chat message and hope the user pastes it.
- Don't tunnel the edit through a Bash one-liner.

Refuse the write explicitly and remind the user how to leave freeze mode if they want the edit applied.

### Step 5 — surface accidental requests early

When the user starts describing work that would obviously cross the freeze line ("now let's update the README at the repo root"), call it out *before* attempting the edit. Saves the user from confirming twice.

## Output format

When refusing an outside-zone write:

```
FREEZE — write refused.
  Target: <absolute path of the would-be write>
  Frozen zone: <path or paths>

To allow this edit:
  - /unfreeze     — leave freeze mode entirely.
  - /freeze <broader-path>   — re-freeze around a wider scope.

Suggested alternative: <if any — e.g., do the edit later in a separate session>.
```

## What NOT to do

- **Don't apply edits outside the zone "just this once."** The whole point of freeze is the guarantee.
- **Don't refuse reads.** Read freely; investigate fully.
- **Don't refuse to run tests, type-checks, or builds that touch files outside the zone.** Those are *processes*, not writes.
- **Don't write or edit `.gitignore`, hooks, or settings outside the zone** to broaden permissions. Those count as writes.
- **Don't auto-merge or auto-push from outside the zone.** Same rule: a `git push` of cross-zone changes is still a write.

## Handoff

- [`/unfreeze`](../unfreeze/SKILL.md) — exit freeze mode.
- [`/guard`](../guard/SKILL.md) — `/freeze` plus [`/careful`](../careful/SKILL.md). The standard for cert prep.
- [`/cert-freeze`](../cert-freeze/SKILL.md) — opinionated freeze around the build / cert directory.
- [`/launch-day`](../launch-day/SKILL.md) — strongest setting; the freeze defaults to the launch-affecting directories.
