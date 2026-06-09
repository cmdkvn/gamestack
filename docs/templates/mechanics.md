<!--
artifact: mechanics
authored_by: developer
audited_by: plan-game-design
schema_version: 1
when_written: "Before /plan-game-design audits it. Authored by the developer (often after /design-jam locks the pitch)."
-->

# {{game name}} — Mechanics

## Core loop

<!-- The moment-to-moment verb cycle the player lives in. Aim for 3–6 steps that close into a loop.
     /plan-game-design will try to articulate this in its own words — write it clearly enough to make that easy. -->

**Primary verb:** {{the one thing the player does most — e.g., "move", "build", "aim"}}

**30-second loop:**
{{step 1 — input}} → {{step 2 — action}} → {{step 3 — immediate feedback}} → {{step 4 — reward/risk that pulls the player back}}

**Secondary verbs (optional):**
<!-- List supporting actions that serve the primary verb. Cut anything that doesn't feed the core loop or a secondary loop the player actively wants. -->
- {{secondary verb 1}}: {{how it serves the loop}}
- {{secondary verb 2}}: {{how it serves the loop}}

## Mechanics list

<!-- One row per mechanic. The "why it earns its place" column must tie back to the core loop or an explicit secondary loop.
     /plan-game-design will flag any mechanic that can't answer this question — answer it here first. -->

| Mechanic | Description | Why it earns its place |
|---|---|---|
| {{mechanic 1}} | {{one sentence}} | {{ties to loop because…}} |
| {{mechanic 2}} | {{one sentence}} | {{ties to loop because…}} |

## Skill curve

<!-- Fill in every row. If you can't fill in Hour 10+, note it explicitly — that's a design gap, not something to leave blank.
     Identical adjacent rows signal a cliff or plateau; fix them before /plan-game-design flags them. -->

| Time horizon | What the player can do | What the player has just learned | What's about to challenge them |
|---|---|---|---|
| Minute 1 | {{}} | {{}} | {{}} |
| Minute 15 | {{}} | {{}} | {{}} |
| Hour 1 | {{}} | {{}} | {{}} |
| Hour 5 | {{}} | {{}} | {{}} |
| Hour 10+ (mid-game) | {{}} | {{}} | {{}} |
| Hour 50+ | {{late-game expression of the loop, or N/A if the game is shorter}} | {{}} | {{}} |

## Difficulty model

<!-- How is challenge calibrated? Be specific — "balanced for most players" is not a difficulty system.
     Options: single difficulty, player-set, tunable post-launch, adaptive/dynamic. -->

**Calibration type:** {{single | player-set | tunable | adaptive}}

**How challenge scales:** {{describe the mechanism — e.g., "enemy count increases each wave; player health is fixed"}}

**Failure is:** {{instant | recoverable | soft-fail (setback but no restart)}}

**Fail state:** {{what happens when the player loses or fails}}

## Progression

<!-- What unlocks, when, and why. Distinguish new verbs/spaces (meaningful) from stat bumps (filler).
     Tie the unlock pace to the skill curve rows above. -->

**Progression structure:** {{linear | branching | open | none}}

**Key unlocks and timing:**
- {{unlock 1}}: unlocks at {{when}} — {{new verb or new space or filler}}
- {{unlock 2}}: unlocks at {{when}} — {{why it matters at this point in the skill curve}}

**Unlock pace rationale:** {{why this unlock cadence matches the skill curve above}}

## Win / loss conditions

**Win condition:** {{what does success look like — score, narrative end, objective complete}}

**Loss condition:** {{what triggers failure — or "no hard loss; see difficulty model"}}

**Recoverability:** {{can the player recover from a bad position, or is loss terminal once triggered}}

## Replay value

<!-- If the game is single-session and not designed for replay, delete this section entirely. If replay is a design goal, be explicit about the mechanism. -->

**Replay mechanism:** {{procedural variation | branching narrative | time attack | none — single-run game}}

**What changes on replay:** {{what is different the second time}}
