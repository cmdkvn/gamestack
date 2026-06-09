<!--
artifact: level-design
authored_by: developer
audited_by: plan-level-design
schema_version: 1
when_written: "Before /plan-level-design audits it. Authored by the developer."
-->

# {{game name}} — Level Design

## Macro structure

<!-- State the top-level structure of the game's world.
     /plan-level-design audits within whatever structure you declare — it won't push to change it.
     Macro-structure changes are /plan-creative-director territory. -->

**Structure type:** {{open world | hub-spoke | linear | chapter-based | metroidvania | other}}

**Overview:** {{brief description of how regions/levels/chapters connect}}

## Tension graph

<!-- One row per major beat (scene, level, chapter section).
     All three dimensions are checked by /plan-level-design:
       Tension (1–10):           how high-stakes is this moment for the player?
       Skill demand (1–10):      how hard is the gameplay execution?
       Narrative density (1–10): how much story content is delivered?
     /plan-level-design will flag monotony zones (>15 min of similar scores),
     spike clusters (3+ peaks back-to-back with no rest beat), and hollow middles. -->

| Beat | Approx. time | Tension (1–10) | Skill demand (1–10) | Narrative density (1–10) |
|---|---|---|---|---|
| {{beat / level name}} | {{e.g., "min 0–15"}} | {{}} | {{}} | {{}} |
| {{beat / level name}} | {{}} | {{}} | {{}} | {{}} |
| {{beat / level name}} | {{}} | {{}} | {{}} | {{}} |

<!-- Continue for all major beats. Identical adjacent rows signal a cliff or plateau — fix before /plan-level-design flags them. -->

## Critical path vs side content

<!-- /plan-level-design checks the ratio:
     If critical path < 50%, optional content must be strong enough to justify the work.
     If critical path > 90%, the game is shorter than it appears in the doc. -->

**Estimated ratio:**
- Critical path (every player sees this): {{X%}}
- Optional content: {{Y%}}

**Per region / chapter:**
| Region / chapter | Critical path | Optional content | Notes |
|---|---|---|---|
| {{region}} | {{content on critical path}} | {{optional content}} | {{}} |

## Navigation and readability

<!-- For each space, /plan-level-design asks how the player knows where to go.
     "The player will figure it out" is not an answer — wayfinding is designed, not discovered.
     "Missing signposting" is the #1 cause of stuck players in QA. -->

| Space | How does the player know where to go? | What stops the wrong way (or makes it valuable)? |
|---|---|---|
| {{space name}} | {{sight lines | lighting | audio | NPC direction | map | quest markers | other}} | {{}} |

<!-- Flag any space where you can't answer column 2 — /plan-level-design will surface it as a finding. -->

## Gating logic

<!-- /plan-level-design sketches the gate graph.
     A deep tree creates soft-lock risk; a flat list signals the game is more linear than the doc implies.
     Gating loops (need A to get B, but B is in a space gated by A) are flagged as top findings. -->

**Gate types used:** {{item | skill | narrative | just-go-there | combination}}

**Gate dependencies:**
| Gate | What it requires | Where the requirement is found | Soft-lock risk? |
|---|---|---|---|
| {{gate / door / progression point}} | {{item X / skill Y / event Z}} | {{location or beat}} | {{yes | no}} |

**Backtracking:** {{describe whether and how players backtrack to fulfill gate requirements}}

## Hero shots and rest beats

<!-- /plan-level-design checks that both are planned:
     Hero shots: visually striking moments intended for the marketing trailer or photo mode.
     Rest beats: explicit low-tension moments that let the player catch their breath.
     A game without planned hero shots is hard to market; a game without rest beats is exhausting. -->

**Planned hero shots:**
| Moment | Location / beat | What makes it visually striking |
|---|---|---|
| {{}} | {{}} | {{}} |

**Planned rest beats:**
| Rest beat | Location / beat | Why this is the right moment for a rest |
|---|---|---|
| {{}} | {{}} | {{}} |
