<!--
artifact: art-direction
authored_by: developer
audited_by: plan-art-direction
schema_version: 1
when_written: "Before /plan-art-direction audits it. Authored by the developer."
-->

# {{game name}} — Art Direction

## Style in one sentence

<!-- A single sentence anyone on the team could quote that captures the visual identity.
     /plan-art-direction will try to quote this line back verbatim — write it sharply enough to survive that test.
     Vague phrases like "dark fantasy" or "retro-inspired" rate ≤ 4; name the specific quality. -->

{{one sentence describing the visual identity of this game}}

## References specificity

<!-- List specific games, films, or artists that are being borrowed from — and name what exactly is being borrowed from each.
     "Looks like Hollow Knight" is not a reference; "Hollow Knight — silhouette contrast and limb proportions" is.
     Generic vibes without a named source rate ≤ 4. -->

| Reference | What is being borrowed from it |
|---|---|
| {{game / film / artist}} | {{the specific quality — not "the vibe"}} |
| {{game / film / artist}} | {{the specific quality}} |

## Color discipline

<!-- Define the palette now. "We'll figure this out in production" is a plan to never ship consistent-looking regions.
     /plan-art-direction checks for: named slots, hex codes, a color script for major regions/scenes,
     and explicit rules about per-region palette shifts. -->

**Palette:**

| Slot | Hex | Used for |
|---|---|---|
| {{slot name}} | `#……` | {{what uses this color}} |
| {{slot name}} | `#……` | {{what uses this color}} |

**Color script (per-region shifts):**
<!-- List the major regions or scenes and note any intentional palette departure from the base palette. -->
- {{region / scene}}: {{shift or "no departure"}}

**Discipline rule:**
{{e.g., "No color outside the palette appears in any sprite." / "Per-region shifts allowed via this rule: …"}}

## Silhouette readability

<!-- Characters distinguishable at 16×16; enemies distinguishable by silhouette alone; interactables visually unique.
     /plan-art-direction will ask: can you tell these apart without color? Answer that question here. -->

**Characters at target resolution:**
- {{character name}}: {{describe silhouette distinguishing feature}}

**Enemies distinguishable by silhouette alone:**
- {{enemy type}}: {{describe silhouette distinguishing feature}}

**Interactables visually unique:**
{{describe what makes interactive objects visually distinct from background elements}}

## Asset budget realism

<!-- /plan-art-direction will not accept "highly detailed" with no numbers attached.
     Set per-platform budgets and state the planned content count. If these aren't set, the plan is not ready. -->

**Target platform(s):** {{PC | mobile | console | all}}

**Texture / atlas budget per platform:**
{{e.g., "2048×2048 max atlas size, 4 atlases per scene"}}

**Draw-call budget:** {{number per frame, or "not yet set"}}

**Planned asset counts:**

| Asset category | Count |
|---|---|
| {{e.g., characters}} | {{n}} |
| {{e.g., regions}} | {{n}} |
| {{...}} | {{...}} |

**Achievability note:**
{{brief statement on whether this count is achievable for the team size and timeline}}

## Animation language

<!-- Frame rate, easing preferences, snap-on-impact policy, idle loop length — be explicit.
     "It'll feel good" is not an animation spec. /plan-art-direction rates this dimension on specificity. -->

**Target frame rate per category:**
- UI: {{fps, or "system frame rate"}}
- Characters: {{fps}}
- VFX: {{fps}}

**Easing preference:** {{linear | ease-out | spring | snap | other}}

**Snap-on-impact policy:** {{e.g., "all attacks snap to first contact frame; recovery eases out"}}

**Idle loop budget:** {{max duration, max frame count}}

## VFX policy

<!-- When particles fire, for how long, how much screen they occupy — explicit.
     "Juicy" is not a policy. /plan-art-direction checks for articulated juice budget and particle constraints. -->

**When particles fire:** {{enumerate the trigger conditions — hit, pickup, dash, death, etc.}}

**Duration limit:** {{max frames per effect}}

**Screen occupancy cap:** {{max % of screen the particle system is allowed to cover}}

**Juice budget:** {{qualitative or quantitative statement of how much VFX the game uses overall}}

## AI-slop resistance

<!-- State what this art WILL NOT do. The check catches unintentional sloppy references.
     /plan-art-direction will scan reference images for floating fingers, plasticky lighting,
     anachronistic blur, and generic fantasy detail. Pre-empt those flags here. -->

**This art avoids:**
- {{specific hallmark being avoided — e.g., "floating finger / hand anatomy errors"}}
- {{specific hallmark being avoided — e.g., "plasticky materials / generic fantasy lighting"}}
- {{specific hallmark being avoided}}

**Reference curation policy:**
{{how references were selected and whether AI-generated references have been reviewed for slop markers}}
