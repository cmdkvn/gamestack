<!--
artifact: art-bible
authored_by: art-bible
schema_version: 1
when_written: "After /plan-art-direction reaches 8+ on most ratings and /art-bible builds the production bible from the locked direction."
-->

# {{game name}} — Art Bible

## 1. One-screen style statement

<!-- /art-bible expands the plan's style sentence into one paragraph (3–5 sentences) covering:
     - The visual reference family in one phrase.
     - The color sensibility (warm/cool, saturated/muted, monochromatic/contrast-heavy).
     - The drawing/rendering attitude (clean lines / painterly / pixelated / stylized geometry).
     - The intentional NOTs — what this art avoids. -->

{{one paragraph}}

## 2. Reference library structure

<!-- /art-bible specifies the _refs/ folder structure. Every reference image is named
     <category>-<subject>-<source>-<index>.png so anyone scanning the folder knows what they're looking at. -->

```
assets/_refs/
├── palette/         # palette swatches, color scripts per region
├── characters/      # silhouette refs, head turnarounds, expressions
├── environments/    # vignettes by region, time of day, weather
├── ui/              # UI element references
├── animation/       # frame timings, easing references, anim cycle refs
├── vfx/             # particle reference moments
└── _do-not/         # AI-slop and trope examples the art avoids
```

## 3. Palette

<!-- Concrete palette table with hex codes. Total palette count target is stated.
     Discipline rule is one of the three standard forms (see below). -->

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

**Total palette count target:** {{number}} slots

**Discipline rule:** {{one of:
- "No color outside the palette appears in any sprite."
- "Per-region shifts allowed via this rule: <…>."
- "Palette is suggestive, not strict — but contrast ratios must hit X."}}

## 4. Silhouette spec

<!-- Per-character / per-important-enemy / per-interactable silhouette test at target resolution.
     Pass criterion: distinguishable from every other silhouette at the test resolution.
     Failures either trigger a redesign or a color-signature compensation rule. -->

| Subject | Test resolution | Pass? | Notes / compensating rule |
|---|---|---|---|
| {{character / enemy / interactable}} | {{16×16 / low-poly outline / other}} | {{yes / no}} | {{redesign needed or color-signature rule}} |

## 5. Environment vignettes

<!-- 3–6 vignettes (paintings, AI-generated + cleaned, or photo-collage refs).
     Each vignette demonstrates a specific dimension. Every vignette has a one-paragraph caption
     explaining "what this vignette proves." -->

| Vignette | File path | Demonstrates | Caption |
|---|---|---|---|
| {{name}} | `assets/_refs/environments/{{filename}}` | {{lighting / color / density / composition}} | {{one paragraph}} |

## 6. Asset naming convention

<!-- The exact pattern every asset file follows. Includes the rule, the categories, and the failure mode if violated. -->

```
{category}_{subject}_{variant}_{state}.{ext}

character_{{subject}}_default_idle.png
character_{{subject}}_default_walk-01.png
prop_{{subject}}_{{variant}}_{{state}}.png
env_{{subject}}_{{variant}}_{{state}}.png
ui_button_primary_normal.png  / _hover.png  / _pressed.png
vfx_{{subject}}_{{variant}}_0.png
```

**Rule:** no spaces; kebab inside fields; snake between fields.

**Categories (open list):** `character`, `prop`, `env`, `ui`, `vfx`

**Failure mode if violated:** importer naming collisions, atlas waste.

## 7. Animation language

<!-- Target frame rate per category, easing curves, snap-on-impact rules, idle loop budget,
     anticipation rule, and impact rule. -->

**Target frame rate per category:**
- UI: {{fps}}
- Characters: {{fps}}
- VFX: {{fps}}

**Easing preferences:** {{linear / ease-out / spring / snap}}

**Idle loop budget:** {{max duration}}, max {{N}} frames.

**Anticipation rule:** {{e.g., "telegraphed attacks get 4–8 frames of anticipation"}}

**Impact rule:** {{e.g., "snap on contact, recover smoothly"}}

## 8. VFX vocabulary

<!-- ~10 named effects for v1. For each: duration in frames, particle count peak,
     color from the palette, and when it fires. Discipline beats variety. -->

| Effect name | Duration (frames) | Particle count peak | Palette color | Fires when |
|---|---|---|---|---|
| `vfx_{{name}}` | {{N}} | {{N}} | `{{slot}}` | {{trigger condition}} |

## 9. UI conventions

<!-- Primary and secondary fonts (with licensing notes if commercial).
     Scale: sizes for headings, body, captions.
     Spacing scale.
     Color use: which palette slots map to which UI element classes. -->

**Primary font:** {{name}} — {{licensing note}}

**Secondary font (if any):** {{name}} — {{licensing note}}

**Type scale:**
- Heading: {{px/rem}}
- Body: {{px/rem}}
- Caption: {{px/rem}}

**Spacing scale:** {{e.g., "powers of 2 from 4px: 4, 8, 16, 32, 64"}}

**Palette-to-UI mapping:**
- `ui-text` → all readable text
- `ui-bg` → menu backgrounds, frame elements
- {{additional mappings}}

## 10. Hand-off checklist

<!-- The exact set of questions an outside artist or AI generator can answer to start producing on-spec. -->

- Style statement: {{provided / missing}}
- Palette: {{slots + hex codes provided / missing}}
- Reference for the asset they're making: {{at `assets/_refs/<category>/` / missing}}
- Naming convention: {{pattern + example provided / missing}}
- Animation rules: {{provided / not applicable}}
- Where to deliver: {{path under `assets/<category>/` / missing}}
- Definition of done: {{silhouette pass / palette compliance / animation cycle complete — as applicable}}
