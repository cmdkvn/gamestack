<!--
artifact: audio-direction
authored_by: developer
audited_by: plan-audio-direction
schema_version: 1
when_written: "Before /plan-audio-direction audits it. Authored by the developer."
-->

# {{game name}} — Audio Direction

## SFX taxonomy

<!-- /plan-audio-direction checks that every category has style notes specific enough to brief a sound designer.
     "Dry, no reverb" is specific. "Sounds good" is not.
     Add or remove rows for categories not in your game; all six are checked by default. -->

| Category | Examples | Style notes |
|---|---|---|
| UI | {{click, confirm, deny, error}} | {{e.g., "Dry, no reverb"}} |
| Player | {{step, jump, hit, hurt, ability}} | {{e.g., "Material-aware (wood/stone/water)"}} |
| World | {{door, switch, pickup, ambient}} | {{e.g., "Spatialized; ambient layered"}} |
| Notifications | {{pickup, save, level-up, alert}} | {{e.g., "Distinct chord, never overlap"}} |
| Diegetic music | {{speakers, radios, in-world instruments}} | {{e.g., "Sourced in space"}} |
| Voice / dialogue | {{speech, grunts, exclamations}} | {{pre-recorded or procedural? notes here}} |

## Music structure

<!-- /plan-audio-direction will push back on "we'll figure it out" — music structure determines composition.
     A composer brought in late can't retrofit a horizontal-cue system if everything was written as 4-minute loops. -->

**Model:** {{static loops | adaptive}}

<!-- If adaptive, specify the system: -->
**Adaptive system (if applicable):** {{layered stems | vertical re-orchestration | tension-state machine | horizontal cues | N/A}}

**Number of music states:** {{count, or "not yet determined"}}

**State triggers:**
<!-- What gameplay events or conditions cause a music state change? -->
- {{state 1}}: triggered by {{condition}}
- {{state 2}}: triggered by {{condition}}

**Composer:** {{named | open — not yet hired}}

**Source file location:** {{path or "not yet decided"}}

## Mix priority

<!-- State the ducking policy: when everything fires at once, what sits under what?
     Without this, the mixer state can't be built.
     /plan-audio-direction will flag a missing policy as a top finding. -->

**Policy stated:** {{yes | no}}

**Priority order:**
<!-- List buses from highest to lowest priority. -->
1. {{bus — e.g., "Player feedback (player damage, ability cast, key pickup)"}}
2. {{bus — e.g., "Voice / dialogue"}}
3. {{bus — e.g., "Notifications"}}
4. {{bus — e.g., "Music"}}
5. {{bus — e.g., "Ambient"}}

## Tooling

<!-- /plan-audio-direction flags a mismatch when adaptive music + spatial audio aspirations stay engine-native.
     Tooling choice changes the budget. -->

**Choice:** {{FMOD | Wwise | engine-native | undecided}}

**Rationale:** {{why this choice fits the plan's complexity}}

## Loudness targets

<!-- /plan-audio-direction will propose defaults if these are absent, then flag it as a top finding.
     A late "mastering pass" breaks every intentional balance. -->

| Track | Target |
|---|---|
| Master | {{e.g., "-14 LUFS integrated"}} |
| Music | {{e.g., "-18 LUFS integrated"}} |
| Dialogue | {{e.g., "-16 LUFS"}} |
| SFX | {{e.g., "Peak -6 dBTP"}} |

## Diegetic vs non-diegetic policy

<!-- When does music exist in the world (a radio plays it) vs. only in the player's headspace?
     Without a policy, designers and composers invent their own and the audio identity fractures. -->

**Policy:** {{describe when audio is diegetic vs non-diegetic in this game}}

## Accessibility

<!-- /plan-audio-direction treats missing accessibility items as top findings.
     Subtitles default ON is non-negotiable per most platform cert requirements (Xbox specifically). -->

- **Subtitles default ON:** {{yes | no | not yet decided}}
- **Closed captions** (non-dialogue audio cues — footsteps, environmental): {{yes | no | not yet decided}}
- **Music / SFX / Voice independent volume sliders:** {{yes | no | not yet decided}}
- **Mono-output option:** {{yes | no | not yet decided}}
- **Visual representation of audio cues** (icon indicators for off-screen sound): {{yes | no | not yet decided}}
