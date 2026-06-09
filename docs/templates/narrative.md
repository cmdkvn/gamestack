<!--
artifact: narrative
authored_by: developer
audited_by: plan-narrative
schema_version: 1
when_written: "Before /plan-narrative audits it. Authored by the developer (often after the pitch is locked and core mechanics are sketched)."
-->

# {{game name}} — Narrative

## Story beats

<!-- High-level arc: the sequence of events and emotional turns from opening to end.
     One row per major beat. Keep it scannable — /plan-narrative will walk this list looking for
     pacing mismatches and emotional beats out of phase with gameplay beats. -->

| # | Beat | Player feels | Gameplay happening | Branching? |
|---|---|---|---|---|
| 1 | {{opening / inciting incident}} | {{e.g., curiosity, dread}} | {{e.g., tutorial, exploration}} | {{yes / no}} |
| 2 | {{escalation}} | {{}} | {{}} | {{}} |
| 3 | {{midpoint turn}} | {{}} | {{}} | {{}} |
| 4 | {{climax}} | {{}} | {{}} | {{}} |
| 5 | {{resolution}} | {{}} | {{}} | {{}} |

<!-- Add rows as needed. If two adjacent rows produce the same player feeling with no gameplay
     shift in between, that's a pacing flat — fix it before /plan-narrative flags it. -->

## Characters

<!-- One entry per major character. Voice cards live in design/voice-cards.md (see docs/templates/voice-cards.md).
     List characters here with their role; /plan-narrative will cross-check against the voice-cards file. -->

| Character | Role in story | First appears at beat # |
|---|---|---|
| {{name}} | {{protagonist / antagonist / foil / guide / etc.}} | {{beat #}} |

## Branching model

<!-- How does player choice affect the story? Be specific. "Players have choices" is not a branching model.
     /plan-narrative will estimate the QA combinatorial cost from whatever you write here. -->

**Branching type:** {{linear-with-choices | multi-ending | persistent-state | faction-style | fully-linear | other}}

**State tracked across choices:**
<!-- List each variable tracked. "Karma" is not enough — write "+1 trust with <character>, tracked per chapter". -->
- {{variable 1}}: {{what it tracks and at what granularity}}
- {{variable 2}}: {{what it tracks and at what granularity}}

**Canonical / fallback path:**
<!-- The path that runs during QA when branching is still being tested. Required if the game branches. -->
{{describe the canonical path, or "N/A — fully linear"}}

**Estimated ending count:** {{number}}

## Exposition plan

<!-- For each major piece of backstory the player needs, state HOW it is delivered.
     /plan-narrative will flag any backstory delivered via uninterrupted dialogue monologue as an info-dump candidate. -->

| Information | Delivery method | Beat it appears at |
|---|---|---|
| {{fact player needs}} | {{action / environmental cue / NPC dialogue / journal entry / cutscene}} | {{beat #}} |

## Emotional ↔ gameplay alignment notes

<!-- Optional but useful: flag any beats where you know the emotional tone and gameplay feel might fight each other.
     E.g., "The grief scene in beat 3 happens during a stealth segment — may undermine both." -->

{{notes, or "no known mismatches — /plan-narrative will audit this"}}

## Localization plan

<!-- /plan-narrative will surface missing localization work as a risk. Answer these now. -->

**Strings externalized for localization:** {{yes from day one | planned before beta | no — English-only ship}}

**Dialogue format:** {{Yarn Spinner | Ink | Dialogic | engine-native Unity | engine-native Godot | custom | not decided}}

**Editor's pass scheduled:** {{yes — at writing-complete | no | not yet planned}}
