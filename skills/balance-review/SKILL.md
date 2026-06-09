---
name: balance-review
description: Systems Designer skill — for games with numbers (combat, economy, progression, crafting). Pulls config tables, runs Monte Carlo on outcomes, identifies dominant strategies and dead choices, proposes specific numeric edits. Use when balance feels off, before launch when balance hasn't been pressure-tested, or after a major mechanic change.
---

# balance-review

This skill pulls the config tables, runs the math, finds the dominant strategies, finds the dead choices, and proposes specific number changes. The failure modes it scans for: one obviously-best strategy that 70% of players pick on first run, intricate progression systems that collapse because two stats interact in a way the designer didn't simulate, and dead options that exist only because nobody pruned them.

## When to fire

Use when the game has numerical systems being designed or tuned. Trigger phrases:
- "Balance review"
- "Is X balanced?"
- "Math check this combat"
- "Find dominant strategies"
- `/balance-review [system]`

Skip for games that are entirely qualitative — narrative-only games without combat, economy, or progression. For those, balance is dramatic pacing (use `/critique --lens=pacing`).

## The lens

A balanced system has:
1. **No dominant strategy** — no single choice that beats every other choice across most situations.
2. **No dead choices** — every option is meaningfully best in some context.
3. **Interesting trade-offs** — most decisions involve real costs.
4. **Failure-mode transparency** — when balance breaks, it's clear where and why.

This skill audits against those four.

## Review mode

Honor `project.review_mode` from `gamestack/state.json` (default: `normal`). Implementation contract: [`docs/STATE.md#review-mode`](../../docs/STATE.md#review-mode).

1. Check `.gamestack/scratch/review-mode-override`; read + delete if present.
2. Otherwise read `project.review_mode` from state.json. Default `normal`.
3. Tag every finding with `[P0]`, `[P1]`, `[P2]`, or `[taste]`.
4. Filter or expand the output per the mode table below.

Mode controls the Monte Carlo sample size and the dominance threshold:

| Mode | Monte Carlo samples | Dominant-strategy threshold | Output |
|---|---|---|---|
| `lean` | 100 | win-rate > 70% across most situations | Top 3 findings — typically just "the dominant strategy is X" and "the dead choices are Y and Z." No simulation breakdown. ≤5 total. |
| `normal` | 1000 | win-rate > 60% across most situations | Full rubric (current behavior). All four lens criteria. Findings ordered by severity then by impact. |
| `intense` | 10,000 | win-rate > 55% across most situations | Full rubric + sensitivity analysis (which 1-2 numeric edits collapse the dominance) + per-strategy variance estimates. |

Severity calibration for balance:

| Tag | What earns it |
|---|---|
| `[P0]` | A strategy that wins >80% of the time, OR an exploit that breaks the economy / progression (infinite XP, free resources) |
| `[P1]` | A clearly dominant strategy (above threshold for the mode), OR a dead choice with no situation where it's best |
| `[P2]` | An asymmetry that may need a tuning pass but isn't dominant; a small variance in expected outcomes |
| `[taste]` | "The combat feels swingy" — judgment about feel, not math |

## Process

### Step 1 — locate the tables

Find the source-of-truth balance data. Common locations:
- `games/<name>/src/Data/*.json`, `*.csv`, `*.xml`.
- Unity ScriptableObject assets in `Assets/Data/`.
- Godot resource files in `data/`.
- Hardcoded constants in code (flag this — config data in code is a maintenance smell).
- A spreadsheet referenced in the design doc.

If the data isn't in a structured form, point this out as a top finding. You can't pressure-test what isn't tabulated.

### Step 2 — identify the system to audit

Ask the developer (if not already specified) which system. Common targets:
- **Combat damage / health / armor.**
- **Economy** (cost / income / inflation curves).
- **Progression** (XP / level requirements / power curves).
- **Crafting / recipe trees.**
- **Loot drop tables.**
- **Encounter difficulty curves.**

Run the audit one system at a time. Cross-system interactions are a follow-up pass.

### Step 3 — read the tables

Build a model of the system in your head (or in a scratch file). For each entry, capture:
- The choice (weapon X, item Y, enemy Z).
- The numbers (damage, health, cost, drop rate).
- The context (what situation does this choice apply in?).

### Step 4 — run dominant-strategy detection

For each pair of choices (A, B), ask: across all reasonable contexts, is A always at least as good as B? If yes, B is dominated by A.

For three or more choices, look for transitive dominance.

A common pattern: cost-effectiveness dominance. If weapon A does 2× damage at 2.1× cost, but weapon C does 4× damage at 4× cost, then A is dominated by C if you can afford it (and "save up for C" is the dominant strategy).

### Step 5 — run dead-choice detection

For each choice, ask: is there at least one context where this choice is *strictly best*? If not, it's a dead choice.

Dead choices come from:
- Stats that don't matter (a weapon with a different stat distribution that loses to all alternatives).
- Costs that don't change behavior (an item that's "available" but never desirable).
- Choices behind unlocks where the unlock comes too late.

### Step 6 — Monte Carlo (when useful)

For systems with randomness (drop rates, RNG outcomes, branching probability), run a simulation:
- Define the player strategy (or strategies to compare).
- Run 1,000–10,000 simulated trials.
- Report outcome distributions: mean, median, p10, p90.

You can do this in your head for simple cases, in Python for complex ones. If running externally, write the script to `playtest/balance/<system>-sim-YYYY-MM-DD.py` and the output to the same directory.

### Step 7 — surface trade-offs

For the choices that survive (not dominated, not dead), articulate the **trade-off** each represents:
- "Weapon A: high damage, low range, high cost — for fast-clear situations."
- "Weapon B: low damage, high range, medium cost — for kiting."
- "Weapon C: medium damage, AOE, slow attack — for crowds."

If you can't articulate a trade-off, the choice might be functionally redundant with another. Flag it.

### Step 8 — propose specific numeric edits

This is the value of the skill: not "tune weapon B," but "raise weapon B's damage from 18 to 23 OR lower its cost from 50 to 35; both bring it within 10% of weapon A's cost-effectiveness."

For each proposed edit, give:
- **Current value.**
- **Proposed value.**
- **Reason.**
- **Predicted effect on player choice.**

### Step 9 — write the report

To `playtest/balance-review/<system>-YYYY-MM-DD.md`.

## Output format

### Minimal shape

```
SYSTEM AUDITED: <system name>
MODE:           <lean | normal | intense>  (samples: <100 | 1000 | 10000>)
THRESHOLD:      <70 | 60 | 55>%

FINDINGS:
  · [P0] <strategy name>: <one-line — e.g., "wins 84% of simulated combats">
  · [P1] <strategy name>: dead choice — no context where it's best
  · [P2] <metric>: <observation>
```

In `lean` mode, only `[P0]` and `[P1]` findings appear. Order findings by severity, then by simulation-impact magnitude (higher win-rate first).

### Full shape

```
SYSTEM: <which system audited>
TABLES READ: <files>

DOMINANT STRATEGIES
  - <choice X> dominates <Y> because <reason>
  - ...

DEAD CHOICES
  - <choice Z>: never strictly best — <why>
  - ...

TRADE-OFFS (the surviving choices)
  - <A>: <one-line trade-off>
  - <B>: ...

MONTE CARLO (if run)
  Strategy 1: mean <X>, p10 <Y>, p90 <Z>
  Strategy 2: ...
  Insight: <one sentence>

PROPOSED EDITS
  - <table entry>: <current> → <proposed> — <reason> — <predicted effect>
  - ...

OPEN QUESTIONS
  - <design call that needs a human decision>

NEXT
  - <recommendation: tune & retest, expand audit to system X, or call balance shippable>
```

## What NOT to do

- **Don't propose perfect balance.** Perfect balance is sometimes bad design — asymmetry can be deliberate (e.g., a "hard mode" character). Confirm the design intent before flattening.
- **Don't audit cross-system without baselining within-system first.** Combat × economy × progression is too many dimensions for one pass.
- **Don't recommend a tune for every choice.** Surface the 3–5 most impactful edits, not 30 minor tweaks.
- **Don't ignore the player skill curve.** A "balanced" system at expert level may be brutally hard for beginners. State the player skill assumption in the report.
- **Don't ship balance without playtesting.** Math tells you the choices exist; playtesting tells you players see them.

## Handoff

After balance-review:
- `/playtest` (M2) — verify the proposed edits in a real session.
- `/plan-game-design` — if the audit reveals the underlying system has a structural issue, re-open at plan level.
- `/balance-review` again — iterate after the first round of tuning.
