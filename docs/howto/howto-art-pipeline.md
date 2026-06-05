# How to walk the gamestack art pipeline

The promise of gamestack is *discipline at the keyboard.* The art pipeline is where that promise gets tested hardest, because art is where solo developers most often start beautiful and end stuck. This walkthrough covers the three weeks between "the verb is fun" and "we are making real assets on a documented spec." Direction first. Then bible. Then exploration. Then persistence.

The example game is **Pip's Garden** — the weather-driven single-screen garden from [howto-first-game-in-an-hour](howto-first-game-in-an-hour.md). The prototype proved the verb. The plant lives or dies on the player's reflexes against an overnight frost. We have placeholder sprites: a green blob, a brown rectangle, a snowflake icon. We are not shipping with those.

The pipeline takes 2–3 weeks of evening-and-weekend pace. Direction is one evening. Bible is one weekend. Exploration is the long tail. Don't compress it. Don't extend it.

## Week 1, evening 1: write the direction (`design/art-direction.md`)

Before any skill runs, you write a draft. The Art Director skill is a reviewer, not a generator — it pressure-tests what you bring to the table. A blank file is a wasted skill invocation.

Write a one-page draft in `games/pips-garden/design/art-direction.md`. It needs eight sections, even if they're rough:

```
Style in one sentence: Painted-storybook with a quiet color script,
                       like a children's book about grief that the
                       publisher passed on.

References:           A Mortician's Tale (UI restraint), Wilbur the
                       cat game (warm domestic scale), The Tiger Who
                       Came to Tea (illustration sensibility).
Palette:               Soft greens, muted earth tones, an icy blue
                       reserved for the frost moments. ~14 colors.
Silhouette:            Plant readable from across the room; player
                       hand-cursor distinct from the plant.
Asset budget:          ~30 sprites, one screen, no environment scroll.
Animation:             12fps hand-drawn idle. Snap on cover-action.
VFX policy:            Particles ONLY at the moment the frost arrives.
                       No ambient sparkle.
AI-slop avoidance:     No floating fingers. No plastic-lit fantasy
                       leaves. No "intricate" decoration with no logic.
```

Eight bullets. That's the input. Now hand it to the Art Director.

## Week 1, evening 2: pressure-test the direction (`/plan-art-direction`)

```
/plan-art-direction
```

The [`/plan-art-direction`](../../skills/plan-art-direction/SKILL.md) skill rates the document 0–10 across eight dimensions. The plan is "ready" when each is ≥ 8. First passes never are. That's the point.

```
RATINGS (0-10)
  Style in one sentence:       8 — "Children's book that didn't get
                                   published" is specific and quotable.
  References specificity:      6 — Three named refs, but you haven't
                                   said WHAT you're borrowing from each.
  Color discipline:            4 — "Soft greens" is a vibe. No hex
                                   codes. No color script. No region
                                   shifts. Production stalls here.
  Silhouette readability:      7 — Plant + cursor sketched. No spec
                                   for the cover-cloth or the frost
                                   icon yet.
  Asset budget realism:        8 — 30 sprites for a one-screen game
                                   is honest. Achievable in 3 weeks.
  Animation language:          5 — "12fps idle, snap on cover" is a
                                   start. Idle loop length unstated.
                                   Easing curves unstated.
  VFX policy:                  9 — "Particles ONLY at frost arrival"
                                   is disciplined. Keep it.
  AI-slop resistance:          7 — Three NOTs listed. Add two more.

WHAT 10 LOOKS LIKE (per under-9 dimension)
  References specificity:   Each ref names one thing being borrowed.
                            "A Mortician's Tale — UI as paper, not
                            chrome." "Wilbur — character scale + small
                            domestic camera." "Tiger Who Came to Tea —
                            line weight + warm flat color."
  Color discipline:         A 14-slot palette with hex codes, two
                            region shifts (day vs. frost-night), and
                            an explicit rule: "No color outside the
                            palette appears in any sprite."
  Silhouette readability:   Four named silhouettes with a 32×32
                            distinguishability test: plant, cursor,
                            cover-cloth, frost icon.
  Animation language:       Idle loop 2s max / 4 frames max. Cover
                            action 6 frames, snap-in, ease-out. Frost
                            arrival 8 frames, no easing — abrupt.

AI-SLOP FLAGS
  - No reference images yet. Walk the references and capture stills.
    Anything sourced from an image generator gets re-sourced to a
    human-made original before it enters _refs/.

TOP 3 ART DIRECTION RISKS
  1. Color script absence will make week 3 a recolor pass.
  2. Without the silhouette test, the frost icon and cover-cloth will
     get re-drawn three times before they read.
  3. "Painted-storybook" is broad. Without illustration references
     showing line weight + flat color, AI-assisted exploration will
     drift toward generic fantasy.

DESIGN DOC EDITS
  <Specific concrete edits to art-direction.md>
```

Accept the edits. The skill rewrites the file in place. Now `art-direction.md` is 1.5 pages with hex codes, four silhouette specs, and references that name what's being borrowed. Re-run `/plan-art-direction`. The ratings move:

```
RATINGS (0-10)
  Style in one sentence:       9
  References specificity:      9
  Color discipline:            9
  Silhouette readability:      8
  Asset budget realism:        8
  Animation language:          9
  VFX policy:                  9
  AI-slop resistance:          8
```

Direction is ready. Commit.

## Week 1, weekend: build the bible (`/art-bible`)

```
/art-bible
```

[`/art-bible`](../../skills/art-bible/SKILL.md) reads the locked direction and produces `design/art-bible.md` — the document any artist (or any image generator with a human curator) can pick up and produce on-spec from.

```
ART BIBLE WRITTEN: games/pips-garden/design/art-bible.md

SUMMARY OF KEY DECISIONS
  Style:            "Painted-storybook with a quiet color script;
                    illustration over rendering; line weight visible;
                    flat color over gradients; muted earth tones; one
                    icy blue reserved for the night the frost comes."
  Palette:          14 slots: bg-deep, bg-mid, bg-near, soil-warm,
                    soil-cool, leaf-shadow, leaf-mid, leaf-light,
                    bloom-accent, frost-blue, frost-glow, ui-text,
                    ui-bg, signal-positive, signal-negative.
  Silhouette spec:  4 characters covered (plant, cursor, cover-cloth,
                    frost icon).
  Vignettes:        4 specified: garden-noon-clear, garden-dusk-cool,
                    garden-night-frost, garden-aftermath-survive.
  Naming pattern:   {category}_{subject}_{variant}_{state}.png
                    e.g. plant_pip_default_idle-01.png
                         vfx_frost_arrival_0.png ... -7.png
  Animation rules:  12fps target. Idle: max 2s, 4 frames. Cover
                    action: 6 frames, snap-in. Frost arrival: 8
                    frames, no easing.

OPEN QUESTIONS
  - Frost-blue hex: provisional #6C8FA9. Confirm against actual
    paint refs once the frost vignette is produced.
  - UI font: not selected yet. Resolve in /art-shotgun for the UI
    capsule round.

FIRST BATCH TO PRODUCE
  1. plant_pip silhouette test card — every other asset bends to
     this one. Establish first.
  2. garden-noon-clear vignette — proves the daytime palette in
     context. The reader sees this before they see frost; if the
     reader doesn't feel warmth here, nothing else lands.
  3. garden-night-frost vignette — proves frost-blue against the
     warm base. The whole game pivots on this contrast working.
  4. cover-cloth idle sprite — the player's tool, the verb made
     physical.
  5. frost icon (UI) — must read at 32×32 from across a Steam
     capsule thumbnail.

NEXT STEPS
  1. Populate _refs/ with the human-sourced reference images
     called out in the bible.
  2. Run /art-shotgun for the silhouette test card first; that
     anchors everything downstream.
  3. Resolve the open questions before week 2 ends.
```

The bible writes to `games/pips-garden/design/art-bible.md`. Reference scaffolding writes to `games/pips-garden/assets/_refs/`:

```
_refs/
├── palette/         (empty — populate with paint chips this week)
├── characters/      (empty — drop plant silhouette refs)
├── environments/    (empty — vignette refs go here)
├── ui/              (empty)
├── animation/       (empty)
├── vfx/             (empty)
└── _do-not/         (one example: a plasticky fantasy leaf, captioned
                     "this is what we are not")
```

The `_do-not/` folder is load-bearing. It's the visible enforcement of the AI-slop guard. Every time you generate a variant in `/art-shotgun`, you'll glance at `_do-not/` and know what to throw out.

## Week 2: populate `_refs/` and stop generating

This is unglamorous and not a skill invocation. You spend an evening walking the references you named in the direction doc. You buy a used copy of *The Tiger Who Came to Tea* for $4. You photograph two spreads. You watch a playthrough of *A Mortician's Tale* and screenshot three UI moments. You paint or photograph the actual paint chips for the 14 palette slots and drop them in `_refs/palette/`.

Why this matters before exploration: variants without reference anchors drift. The first round will look like a generic image-generator-fantasy garden and you'll spend a week being disappointed. Anchor first.

By the end of week 2 evening 3 your `_refs/characters/` has six images of how illustrators have drawn plants over the last fifty years. None are AI-generated. None copy a living artist's style — you are studying line weight and color from books, not imitating named people.

This is also when you write the negative prompts you'll paste into every variant later:

```
Negative (pasted into every art-shotgun variant):
  no photorealism, no plastic lighting, no rendered-leaf detail,
  no floating fingers, no chromatic aberration, no lens flare,
  no anachronistic depth-of-field, no generic-fantasy mush
```

## Week 2, weekend: first shotgun round (`/art-shotgun`)

```
/art-shotgun plant_pip silhouette test card
```

[`/art-shotgun`](../../skills/art-shotgun/SKILL.md) reads the bible and produces 4–6 prompt variants. The first subject is the one the bible called out: the plant silhouette. Every other asset bends to it.

The skill asks the clarifying questions first:

```
SUBJECT:    plant_pip silhouette test card
FORMAT:     character turnaround (idle pose)
USE CASE:   silhouette test card — must read at 32×32
RESOLUTION: 1024×1024 master, with 32×32 thumbnail proof

Generating 5 variants, each varying ONE axis.

ROUND 1 — SUBJECT: plant_pip silhouette test card

VARIANTS
  V1 — leaf-shape:       broad-leaf
                         "Pip, a small potted houseplant in a clay
                          pot, broad rounded leaves spreading outward,
                          painted-storybook illustration, visible line
                          weight, flat color, 14-color palette
                          [palette pasted], neutral background, full
                          body centered, [negative prompts pasted]"
  V2 — leaf-shape:       slender-leaf
                         (same prompt; leaves are long and tapering)
  V3 — leaf-shape:       lobed-leaf
                         (same prompt; leaves are oak-like, irregular)
  V4 — leaf-shape:       fern-frond
                         (same prompt; fronds with visible pinnae)
  V5 — leaf-shape:       single-stem
                         (same prompt; one central stalk + a bloom)

COMPARISON SETUP
  Save outputs to: assets/_refs/_shotgun/plant_pip/round-1/
  Open as:         Finder gallery view, side-by-side
  Come back with:  per-variant feedback
                   (Keep / Discard / Mix-In, what worked, what didn't)
```

Notice: one axis varies. Only leaf-shape. The lighting, color, composition, and style are held constant from the bible. That's the discipline — you learn one preference per round.

You run the prompts in whatever generator you use. Save the outputs to the path. Open them in Finder. Look at them for ten minutes. Then come back to the skill with feedback:

```
V1 broad-leaf:      DISCARD — reads as too generic. No personality.
V2 slender-leaf:    MIX-IN  — graceful but disappears at 32×32.
V3 lobed-leaf:      KEEP    — silhouette is distinctive. Pip has a
                              shape. Confidence: high.
V4 fern-frond:      DISCARD — beautiful but reads as fragile. The
                              game's emotional arc needs Pip to feel
                              like it could survive.
V5 single-stem:     MIX-IN  — the bloom is interesting. Carry the
                              bloom into V3 next round.

CROSS-CUTTING:
  - Distinctive silhouette beats elegance. Confirm next round.
  - Bloom adds emotional stakes. Carry into the lobed-leaf winner.
```

The skill captures this. Next round will branch off V3 (lobed-leaf) and vary the next axis — probably pot shape, or the bloom decision from V5.

## Persist the taste signal (`gamestack-taste-update`)

After every round you write the approvals to NDJSON and feed them into [`gamestack-taste-update`](../../bin/impl/taste-update/README.md):

```bash
gamestack-taste-update \
  --project ./games/pips-garden \
  --record assets/_refs/_shotgun/plant_pip/round-1/approvals.ndjson
```

The CLI appends to `.gamestack/taste.json`. After one round, no signal has fired yet — the threshold is **≥4 samples** and **≥70% win rate** per axis value, and round 1 only has one approval per axis value. That's fine. The signals emerge across rounds.

## Week 2–3: rounds 2 through 5

You run shotgun on the next bible-priority assets. Each round is one axis varied. Each round's approvals get piped into `gamestack-taste-update`. The rounds are:

- Round 2 — `plant_pip` pot shape: terracotta-round / terracotta-square / glazed-blue / wooden-crate / no-pot.
- Round 3 — `garden-noon-clear` vignette composition: centered / off-center-left / table-edge / sill-and-window / overhead.
- Round 4 — `garden-night-frost` vignette lighting: backlit-moon / sidelit-window / under-lit-floor / silhouette / rim-light.
- Round 5 — `cover-cloth` color: ivory / undyed-linen / faded-blue / dusty-rose / pale-mint.

By the end of round 5 you have 20+ approvals across five axes. Run the CLI's `--show`:

```bash
gamestack-taste-update --project ./games/pips-garden --show
```

```
TASTE PROFILE — games/pips-garden

EMERGING SIGNALS
  composition: 'off-center-left' wins (80% over 5 samples, leads
                                       next by 40%)
  lighting:    'backlit-moon'    wins (75% over 4 samples, leads
                                       next by 25%)

NOT YET CONVERGED
  leaf-shape  — 1 sample. Need 4.
  pot-shape   — 1 sample. Need 4.
  cloth-color — 1 sample. Need 4.

ROUNDS LOGGED: 5
LAST UPDATED:  2026-06-19
```

Two signals fired. The next shotgun round on any new subject pre-seeds backlit-moon lighting and off-center-left composition into every variant prompt, and varies a *different* axis. That's the persistence layer working. The next exploration doesn't restart from zero.

## Week 3: produce the first batch

With the bible locked, the references curated, and the taste profile surfacing real signals, you produce the first 5 assets from the bible's "FIRST BATCH TO PRODUCE" list. Each asset is generated under the bible's constraints: palette compliance, naming convention, silhouette test, the taste profile's pre-seeded signals.

A note on AI generation, because this is where solo devs get into trouble. Generated images make excellent *references* and *placeholders.* Shipping them as final assets without disclosure has three tradeoffs you must look at honestly: (1) the storefront and the press will ask, and "no comment" reads worse than "yes, with this workflow"; (2) palette and silhouette discipline are harder to hold across a generator's stochastic output than across a human artist's hand; (3) your players can usually tell, and the conversation gets dominated by *that* instead of by the game. The pipeline above does not forbid AI final assets. It forces you to choose deliberately. If you ship them, write the choice into `design/art-direction.md` so the decision is visible to your future self.

## What just happened

In 2–3 weeks of evening-and-weekend pace you went from "no art direction" to:

- A pressure-tested art direction document with hex codes, named silhouettes, and explicit NOTs (`design/art-direction.md`).
- A production-ready art bible any artist or curator could pick up and produce on-spec from (`design/art-bible.md`).
- A curated `_refs/` library with human-sourced references and a visible `_do-not/` enforcement folder.
- Five structured exploration rounds, each varying one axis, captured in `_refs/_shotgun/<subject>/round-N/`.
- A persistent taste profile at `.gamestack/taste.json` with two signals already firing.
- A first batch of 5 production-ready assets matching the bible's spec.

Without gamestack, the same 2–3 weeks usually produces a Pinterest board, two abandoned style experiments, and the feeling that the art is "almost there" without being able to say what's missing.

## What comes next

- **Hour 18.** [`/plan-audio-direction`](../../skills/plan-audio-direction/SKILL.md) — the frost moments need sound. Audio direction inherits choices from the art direction (quiet, restrained, one accent).
- **Hour 24.** [`/asset-audit`](../../skills/asset-audit/SKILL.md) on the first batch — validate that the naming convention holds and the budget is on track before you produce 25 more.
- **Hour 36.** Re-run [`/plan-art-direction`](../../skills/plan-art-direction/SKILL.md) once 10–15 production assets exist. Direction documents drift; the periodic re-rate keeps the spec honest.
- **Day 90.** Run `gamestack-taste-update --decay --halflife-days 90` once a quarter so old preferences fade and recent ones lead.

## Related

- [`/plan-art-direction`](../../skills/plan-art-direction/SKILL.md) — direction pressure test.
- [`/art-bible`](../../skills/art-bible/SKILL.md) — production bible.
- [`/art-shotgun`](../../skills/art-shotgun/SKILL.md) — structured visual exploration.
- [`gamestack-taste-update`](../../bin/impl/taste-update/README.md) — persistent taste profile.
- [`/asset-audit`](../../skills/asset-audit/SKILL.md) — once production assets exist, validate against budget.
- [`/plan-audio-direction`](../../skills/plan-audio-direction/SKILL.md) — the audio counterpart to this pipeline.
- The previous tutorial: [howto-first-game-in-an-hour](howto-first-game-in-an-hour.md).
