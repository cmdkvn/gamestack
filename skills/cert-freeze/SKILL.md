---
name: cert-freeze
description: Power tool — opinionated [`/freeze`](../freeze/SKILL.md) tuned for cert runs. Restricts edits to the build / cert directories (so platform-affecting code doesn't move under cert's feet), keeps [`/careful`](../careful/SKILL.md) on by default, and surfaces a one-line reminder of the cert audit checklist. Use during PS5 TRC / Xbox TCR-XR / Switch lotcheck submission windows.
---

# cert-freeze

You are operating in CERT-FREEZE mode. The user has entered the cert phase — the build that's about to be submitted (or that's already in the platform's queue) must not move under cert's feet. A typo in a script touched at the wrong moment can resubmit the queue and burn a week.

This is [`/freeze`](../freeze/SKILL.md) with a curated default zone, plus [`/careful`](../careful/SKILL.md) discipline, plus a cert-specific reminder surface.

## When to fire

- Direct invocation: `/cert-freeze`. With no argument, the default zone is the union of:
  - `build/`
  - `Builds/`
  - `dist/`
  - `docs/cert/`
  - `playtest/cert-readiness/`
  - `playtest/playtest-*/`
- With argument: `/cert-freeze <path>` overrides the default zone.

Stays active until the user invokes [`/unfreeze`](../unfreeze/SKILL.md), [`/unguard`](../guard/SKILL.md), or `/cert-pass` (signals cert succeeded).

## Process

### Step 1 — confirm the cert phase

Read the game's `CLAUDE.md` (or `STUDIO.md` for the active game). The current production phase should be **Cert**. If it's a different phase, surface it and ask whether `/cert-freeze` is really intended:

```
This project's CLAUDE.md declares phase = Production, not Cert.
/cert-freeze locks the build / cert paths. Run anyway? (yes / no)
```

Proceed only on confirm.

### Step 2 — apply the default zone

Compute the frozen zone by intersecting the project's actual paths with the default cert paths above. Drop paths that don't exist (no false reassurance). Surface the resolved zone:

```
CERT-FREEZE — restricted to:
  - build/
  - docs/cert/
  - playtest/cert-readiness/
  - playtest/playtest-20260603-cert-save-fuzz/

CAREFUL is on. Destructive ops require confirmation.
```

### Step 3 — surface the cert-specific reminders

Before the first session task, surface:
- Which platform(s) the cert run targets (from `--platform` or by detecting marker files).
- The location of the NDA-protected checklist on file (if present in `docs/cert/`).
- Submission readiness from the last [`gamestack-cert-checklist`](../../bin/impl/cert-checklist/README.md) run, if a recent JSON report is in `playtest/cert-readiness/`.

This is one block at session start, not a per-message banner.

### Step 4 — gate edits to platform-affecting paths

The frozen zone covers cert artifacts and build outputs. Edits to gameplay code, scripts, prefabs, materials, scenes — anything that would invalidate a build — are refused. The cert window is for cert-specific work only.

If the user genuinely needs to fix a gameplay bug mid-cert (cert-blocking), the path is:
1. Surface the change cost (resubmission, new lotcheck queue).
2. Have the user explicitly [`/unfreeze`](../unfreeze/SKILL.md) and accept the cost.
3. After the fix lands, re-issue `/cert-freeze` and re-run [`gamestack-cert-checklist`](../../bin/impl/cert-checklist/README.md).

### Step 5 — pair with [`/playtest`](../playtest/SKILL.md) cert scenarios

Cert-class playtest scenarios (`04-cert-controller-disconnect.json`, `05-cert-save-fuzz.json`) are how cert categories move from `NEEDS_LIVE_TEST` to `PASS`. During `/cert-freeze`, running those via [`gamestack-playtest-daemon`](../../bin/impl/playtest-daemon/README.md) is safe — the daemon writes run logs into the frozen zone.

## What NOT to do

- **Don't auto-upload to console partner portals.** That's the [`/publish`](../publish/SKILL.md) skill's explicit boundary; cert-freeze doesn't override it.
- **Don't relax the zone "just for one file."** Any edit outside the zone is a build-invalidating edit unless the developer explicitly accepts the resubmission cost.
- **Don't take "yes" to non-cert fixes lightly.** Re-confirm by stating the resubmission cost in concrete terms ("submission queue resets; +1 week").
- **Don't claim to substitute for the NDA-protected checklist.** Same rule as the underlying [`/cert-readiness`](../cert-readiness/SKILL.md) skill.

## Handoff

- `/cert-pass` — cert succeeded; drop `/cert-freeze` and move to [`/publish`](../publish/SKILL.md) prep.
- [`/unfreeze`](../unfreeze/SKILL.md) — lift the freeze (typically only used when accepting a resubmission cost).
- [`/cert-readiness`](../cert-readiness/SKILL.md) — rerun the audit if anything material changed.
- [`gamestack-cert-checklist`](../../bin/impl/cert-checklist/README.md) — same lens, CI-friendly.
- [`gamestack-playtest-daemon`](../../bin/impl/playtest-daemon/README.md) — drives cert-class scenarios.
- [`/launch-day`](../launch-day/SKILL.md) — once cert passes and the ship day arrives.
