---
name: art-bible
description: Concept Artist skill — builds the production art bible from the locked art direction plan. Produces a complete asset specification any artist (or image generator) can follow: palette with hex codes, character silhouettes, environment vignettes, asset naming convention, reference image library structure. Use after /plan-art-direction reaches 8+ on most ratings and the developer is ready to start producing real assets.
---

# art-bible

This skill translates a locked art direction into a working bible — the document a junior artist, a contractor, or an AI image generator could pick up and produce on-spec assets from. The job: take the plan and make it executable. Be specific. Hand-wave-free.

## When to fire

Use after `/plan-art-direction` has rated the art plan and the developer wants to start producing real assets. Trigger phrases:
- "Build the art bible"
- "Produce the art bible"
- "Make the asset spec"
- "Concept art bible"
- `/art-bible`

If `/plan-art-direction` ratings are mostly below 7, redirect there first — bibles built on weak plans become a re-do.

## What the bible contains

| Section | Purpose |
|---|---|
| 1. One-screen style statement | The single paragraph anyone joining the project reads first. |
| 2. Reference library structure | Where reference images live, naming convention for them, what each one demonstrates. |
| 3. Palette | Hex codes, slot names, per-region shifts, palette discipline rules. |
| 4. Silhouette spec | Per-character silhouettes drawn (or commissioned) at the target pixel/poly density. |
| 5. Environment vignettes | 3–6 painted (or AI-rendered + cleaned) vignettes that demonstrate light, color, density, framing. |
| 6. Asset naming convention | The exact pattern every asset filename follows. |
| 7. Animation language | Frame rate, easing curves, snap-on-impact rules, idle loop budget. |
| 8. VFX vocabulary | What particles do what, how long they last, how they fade. |
| 9. UI conventions | Font choices, scale, spacing, color usage. |
| 10. Hand-off checklist | What an artist or AI generator needs to start producing on-spec. |

## Process

### Step 1 — read the plan

Read `design/art-direction.md` end to end. Note where it's specific vs. hand-waved. Check for `plan-art-direction-*.md` review files in `design/reviews/` — they'll already flag the weak spots.

### Step 2 — produce sections 1–4 (the load-bearing ones)

These four sections gate everything else. Don't proceed to environment vignettes or VFX without them.

#### 1. One-screen style statement
Take the plan's style sentence and expand it to one paragraph (3–5 sentences). It should describe:
- The visual reference family in one phrase.
- The color sensibility (warm/cool, saturated/muted, monochromatic/contrast-heavy).
- The drawing/rendering attitude (clean lines / painterly / pixelated / stylized geometry).
- The intentional NOTs — what this art avoids.

#### 2. Reference library structure
Create or specify `games/<name>/assets/_refs/` with subfolders:
```
_refs/
├── palette/         # palette swatches, color scripts per region
├── characters/      # silhouette refs, head turnarounds, expressions
├── environments/    # vignettes by region, time of day, weather
├── ui/              # UI element references
├── animation/       # frame timings, easing references, anim cycle refs
├── vfx/             # particle reference moments
└── _do-not/         # AI-slop and trope examples the art avoids
```
Every reference image is named `<category>-<subject>-<source>-<index>.png` so anyone scanning the folder knows what they're looking at.

#### 3. Palette
Produce a concrete palette table:

| Slot | Hex | Used for |
|---|---|---|
| `bg-deep` | `#…` | Far backgrounds, sky, atmospheric depth |
| `bg-mid` | `#…` | Mid-ground, distant terrain |
| `fg-key` | `#…` | Foreground subjects, characters |
| `fg-accent` | `#…` | Highlights, interactable elements, eye-draw |
| `ui-text` | `#…` | All readable text |
| `ui-bg` | `#…` | Menu backgrounds, frame elements |
| `signal-positive` | `#…` | Buffs, pickups, success states |
| `signal-negative` | `#…` | Damage, warnings, fail states |
| ... | ... | per-region or per-scene additions |

Total palette count target: state it. **Discipline rule** (one of these):
- "No color outside the palette appears in any sprite."
- "Per-region shifts allowed via this rule: <…>."
- "Palette is suggestive, not strict — but contrast ratios must hit X."

#### 4. Silhouette spec
For every named character / important enemy / interactable:
- A silhouette test at the target resolution (16×16 if pixel art, low-poly outline if 3D).
- Pass criterion: distinguishable from every other silhouette at the test resolution.
- Note any failures and either: redesign the silhouette, or add a color-signature rule to compensate.

### Step 3 — produce sections 5–10

These build on the foundation. Don't bother making them brilliant until 1–4 are locked.

#### 5. Environment vignettes
Specify 3–6 vignettes (paintings, AI-generated + cleaned, or photo-collage refs). Each vignette demonstrates a specific dimension:
- Lighting / time of day.
- Color sensibility in context.
- Density / negative space.
- Composition / framing.

For each vignette, write a one-paragraph "what this vignette proves" caption.

#### 6. Asset naming convention
The pattern every asset file follows. Example:
```
{category}_{subject}_{variant}_{state}.{ext}

character_marin_default_idle.png
character_marin_default_walk-01.png  ... walk-08.png
prop_lantern_brass_lit.png
env_lighthouse_main_dawn.png
ui_button_primary_normal.png  / _hover.png  / _pressed.png
vfx_dash_dust_0.png  ... vfx_dash_dust_7.png
```

Include the **rule** (no spaces, kebab inside fields, snake between fields), the **categories** (open list), and the **failure mode if violated** (importer naming collisions, atlas waste).

#### 7. Animation language
- Target frame rate per category (UI / characters / VFX).
- Easing preferences (linear / ease-out / spring / snap).
- Idle loop budget (e.g., max 2 seconds, max 4 frames).
- Anticipation rule (telegraphed attacks get 4-8 frames of anticipation).
- Impact rule (snap on contact, recover smoothly).

#### 8. VFX vocabulary
A short list of named effects: `vfx_dash_dust`, `vfx_hit_spark`, `vfx_pickup_glimmer`, etc. For each:
- Duration in frames.
- Particle count peak.
- Color from the palette.
- When it fires.

Limit to ~10 named effects for v1. Discipline beats variety.

#### 9. UI conventions
- Primary and secondary fonts (with licensing notes if commercial).
- Scale: rem/px sizes for headings, body, captions.
- Spacing scale: powers of 2 from 4px, or another consistent scheme.
- Color use: which palette slots map to which UI element classes.

#### 10. Hand-off checklist
The exact set of questions an outside artist or AI generator can answer to start producing on-spec:
- Style statement: ✅ provided
- Palette: ✅ slots + hex codes
- Reference for the asset they're making: ✅ at `_refs/<category>/...`
- Naming convention: ✅ pattern + example
- Animation rules: ✅ if applicable
- Where to deliver: ✅ path under `assets/<category>/`
- Definition of done: ✅ silhouette pass / palette compliance / animation cycle complete

### Step 4 — write the bible

Write the bible to `games/<name>/design/art-bible.md` (or `design/art-bible.md` if not in a game directory). Use the sections above as headings.

Place reference images (and propose where the developer should add them) under `games/<name>/assets/_refs/`.

### Step 5 — propose first batch of assets to produce

Recommend the first 5–10 assets to produce, ordered by:
1. **Silhouette-defining hero shots** — establish the character and environment language first.
2. **Palette confirmation pieces** — prove the palette works in context.
3. **First playable's required assets** — what does the prototype need to look on-spec?

## Output

**Output:** writes to `design/art-bible.md` — schema: see [`docs/templates/art-bible.md`](../../docs/templates/art-bible.md).

After writing the bible, emit a session summary:

```
ART BIBLE WRITTEN: <path>

SUMMARY OF KEY DECISIONS
  Style:            <one paragraph>
  Palette:          <N slots>
  Silhouette spec:  <N characters covered>
  Vignettes:        <N produced or specified>
  Naming pattern:   <pattern>
  Animation rules:  <key constraints>

OPEN QUESTIONS
  - <question 1>: <where to resolve>
  - ...

FIRST BATCH TO PRODUCE
  1. <asset> — <why this one first>
  2. ...

NEXT STEPS
  <The 1–3 things to do before any production art happens>
```

## What NOT to do

- **Don't write the bible on top of an under-7 art plan.** Bible quality is bounded by plan quality. Send the developer back to `/plan-art-direction` if the plan isn't ready.
- **Don't propose more than 10 named VFX in the bible.** Discipline. The list will grow naturally.
- **Don't skip the silhouette spec because "it's pixel art and they're stylized."** Silhouette readability matters more in pixel art, not less.
- **Don't generate dozens of reference images yourself.** Specify what reference is needed and where it goes; let the developer curate or generate the actual references via `/art-shotgun` next.
- **Don't include unrelated style explorations.** The bible locks the chosen direction. Exploration happens in `/art-shotgun`.

## Handoff

After art-bible:
- `/art-shotgun` — for specific scenes or characters needing visual exploration before final art.
- `/scene-prototype` — once the bible exists, produce engine-ready scene skeletons that respect the bible.
- `/design-review` (post-M2) — once real assets exist, audit them against the bible.
- `/asset-audit` (M2) — once production assets exist, validate they hit the naming convention and per-platform budgets.
