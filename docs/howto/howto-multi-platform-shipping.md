# How to ship the same game to Steam, Switch, and mobile without losing six weeks

The promise of gamestack at the cert end of the pipeline is *honest math.* This walkthrough takes a game that's six weeks from a Steam launch, asks "what would it take to also ship Switch and mobile on the same content," and uses the asset-audit / cert-readiness loop to either pull that off or — more often — discover which of the targets has to be cut while there's still time.

The example game is **Tideglass** — a 4-hour narrative game about lighthouse-keeping in a town that surfaces from the sea at low tide. Pixel art, two character actors, six interior scenes, a heavy ambient music score, save-game per chapter. Solo dev. Engine: Unity. Current build: 1.8 GB on disk, 12 chapters scripted, audio mastered, Steam page live and wishlisted ~3,400.

Steam launch is locked: **2026-07-17**. The dev wants to add Switch and a low-end mobile target. The question this tutorial answers is "what fits, what doesn't, in what order."

Don't take the example seriously. The point is the *shape* of the six weeks.

## Day 0: pick the targets honestly

Before any audit, name the targets out loud. Targets in this walkthrough:

```
TARGETS
  steam      — pc-hi  (4096 textures, 1024 MB atlas, 192-320 kbps audio)
  switch     — switch-handheld  (1024 textures, 256 MB atlas, 96-192 kbps)
  mobile     — mobile-lo  (512 textures, 128 MB atlas, 64-128 kbps)

CUT FROM CONSIDERATION
  web        — 50 MB total load. Tideglass ships 380 MB of music alone.
               Not a credible target for this game.
```

The dev wanted to add itch / browser as a fourth target. The [`web` budget](../../bin/impl/shared/platforms.ts) is 50 MB *total runtime load*. Tideglass has a 380 MB compressed score before you count voice or sprites. Tell the dev no on web. Spending two days proving it won't fit is two days that should go into Switch.

This is the discipline the tutorial enforces: pick targets that pass the back-of-envelope test before opening any tooling.

## Week 1: aim at the tightest target first

Counterintuitive but load-bearing. Don't start with Steam. Start with the tightest target, because passing the tightest means passing the others. From the [budgets table](../../bin/impl/shared/platforms.ts):

| Target | Texture max | Atlas budget | Audio max | Env tris | Char tris |
|---|---|---|---|---|---|
| pc-hi (Steam) | 4096 | 1024 MB | 320 kbps | 100k | 20k |
| switch-handheld | 1024 | 256 MB | 192 kbps | 20k | 8k |
| mobile-lo | 512 | 128 MB | 128 kbps | 15k | 5k |

Mobile-lo halves the texture max relative to Switch and cuts the atlas budget by half again. That's the audit to run first.

```
gamestack-asset-audit --project ./games/tideglass --platform mobile-lo --format md
```

The CLI walks the asset tree. First-run output for a Steam-tuned project:

```
PLATFORM: mobile-lo
SCAN ROOT: Assets
ASSET COUNT: 1,842
ENGINE: unity
BUDGET: textureMax=512, totalAtlasMB=128, audioBitrateMaxKbps=128

TEXTURE VIOLATIONS (47 findings, ~340 MB potential savings)
  - Assets/Art/Backgrounds/lighthouse_interior_01.png: 4096x2304, PNG, no compression
    Action: resize to 512 max + ASTC 6x6
  - Assets/Art/Backgrounds/town_dawn.png: 4096x2304, PNG, no compression
    Action: resize to 512 max + ASTC 6x6
  - Assets/Art/Characters/keeper_idle_sheet.png: 2048x2048, PNG, Crunch off
    Action: split into 4x 512x512 atlas or 1x 1024 + downscale at runtime
  - [44 more...]

AUDIO VIOLATIONS (12 findings, ~210 MB potential savings)
  - Assets/Audio/Music/ch01_arrival.wav: WAV 1411 kbps stereo
    Action: re-encode to Vorbis 96 kbps mono ambient mix
  - Assets/Audio/Music/ch02_low_tide.wav: WAV 1411 kbps stereo
    Action: re-encode to Vorbis 96 kbps
  - [10 more...]

CRITICAL (P0)
  - none

SUMMARY
  Total asset bytes:                    1,820 MB
  Estimated savings if all fixes applied: 612 MB
  Under mobile-lo budget:                NO — over by ~1.4 GB after fixes

PROPOSED ACTIONS (ordered by impact)
  1. Resize all backgrounds to 512px (47 textures): ~340 MB
  2. Re-encode all music to Vorbis 96 kbps mono ambient: ~210 MB
  3. Build a mobile-only sprite atlas pass: ~60 MB
```

This is the moment of truth. **Tideglass cannot ship mobile-lo as one binary with Steam.** Even after every audit-suggested fix, the project sits 1.4 GB above budget. A solo dev does not retouch 47 backgrounds to half-resolution six weeks before Steam launch.

The honest options:

```
OPTIONS FOR MOBILE
  A — cut mobile from this launch wave. Revisit after Steam ships.
  B — ship mobile-hi instead of mobile-lo (1024 textures, 256 MB atlas).
      Same texture cap as Switch. Reuse Switch assets. Lose low-end Android.
  C — build a separate "mobile bundle" with downscaled textures + streaming
      audio. ~3 weeks of work. Cannot fit in this launch window.
```

Pick B. Mobile-hi shares the texture cap with Switch, so the same downscale pass serves both targets. Document the decision in `design/launch-targets.md` — every future "should we...?" is bounded by this choice.

## Week 1, day 3-5: run the Switch audit and discover the real work

Switch-handheld is now the tightest *credible* target. Run it.

```
gamestack-asset-audit --project ./games/tideglass --platform switch-handheld --format md
```

```
PLATFORM: switch-handheld
SCAN ROOT: Assets
ASSET COUNT: 1,842
BUDGET: textureMax=1024, totalAtlasMB=256, audioBitrateMaxKbps=192

TEXTURE VIOLATIONS (39 findings, ~280 MB potential savings)
  - Assets/Art/Backgrounds/lighthouse_interior_01.png: 4096x2304
    Action: resize to 1024 max + ASTC 6x6
  - [38 more...]

ATLAS WASTE (INFO — interactive skill recommended)
  - Assets/Art/UI/dialog_atlas.spriteatlas: candidate for repack
  - Assets/Art/UI/menu_atlas.spriteatlas: candidate for repack

AUDIO VIOLATIONS (12 findings, ~140 MB potential savings)
  - Assets/Audio/Music/ch01_arrival.wav: WAV in build
    Action: re-encode to Vorbis 160 kbps (Switch headphone target)
  - [11 more...]

CRITICAL (P0)
  - none

SUMMARY
  Total asset bytes:                    1,820 MB
  Estimated savings if all fixes applied: 420 MB
  Under switch-handheld budget:          NO — over by ~1.1 GB after fixes

  Memory ceiling: 4 GB handheld with OS reservation (~3.2 GB usable)
  Runtime texture residency estimate:    ~310 MB (over 256 MB budget)
```

Still over. But the gap has shrunk from 1.4 GB to 1.1 GB, and the texture residency overage is now in atlas-repack territory rather than wholesale-resize territory.

This is where the CLI hands off to the interactive skill. The CLI [explicitly does not](../../bin/impl/asset-audit/README.md) parse atlas packing ratios, audio bitrates from compressed headers, or per-Unity-importer compression overrides. Time to call the skill.

```
/asset-audit switch-handheld
```

The Technical Artist reads the same scan plus the engine importer settings:

```
PLATFORM: switch-handheld
SCAN ROOT: Assets (Unity 2022.3.40f1)

TEXTURE IMPORTER AUDIT
  - 39 backgrounds: Max Size = 4096 (per-platform override missing for Switch)
    Action: set Switch override to 1024 + ASTC 6x6. Estimated savings: 280 MB.
  - 12 character sheets: Crunch compression OFF
    Action: enable Crunch (quality 50). Estimated savings: 40 MB.
  - 6 UI atlases: power-of-two violation (1300x980, 1700x900, ...)
    Action: snap to POT (1024x1024, 2048x1024). Compression won't apply until POT.

ATLAS PACKING
  - dialog_atlas.spriteatlas: 38% packed (2048x2048 with 8 sprites)
    Action: split into 2x 1024x1024 atlases by usage frequency.
  - menu_atlas.spriteatlas: 41% packed
    Action: collapse with title_atlas (sibling, 33% packed).

AUDIO IMPORTER AUDIT
  - 12 music tracks: Compression Format = PCM, Load Type = Decompress on Load
    Action: Vorbis quality 70 + Streaming. Each track will residency at ~1 MB
    instead of full decompressed size. Estimated savings: 180 MB residency, 80 MB
    on-disk.
  - 47 SFX: Stereo, Force To Mono = off
    Action: Force To Mono on. SFX is positional / one-shot, never needs stereo.
    Estimated savings: 18 MB.

CRITICAL (P0)
  - none

PROPOSED ACTIONS (ordered by impact)
  1. Set Switch Max Size override to 1024 on all backgrounds.
     Estimated savings: 280 MB on-disk, 220 MB runtime.
  2. Switch all music to Vorbis Streaming.
     Estimated savings: 180 MB runtime residency.
  3. Repack dialog_atlas + menu_atlas + title_atlas.
     Estimated savings: 35 MB.
  4. Force-mono all SFX.
     Estimated savings: 18 MB.

POST-FIX PROJECTION
  Switch build size: ~1.2 GB (fits cart; under cart size threshold)
  Switch runtime texture residency: ~200 MB (under 256 MB budget)
  Switch runtime audio residency: ~85 MB (streaming model)
```

That works. The actionable surface is now a one-week task: per-platform texture override, music to Vorbis streaming, three atlas repacks, force-mono SFX. None of these change source assets; they all live in Unity importer settings. None of them block Steam — the per-platform overrides only apply on the Switch build target.

Write the report to `playtest/asset-audit/switch-handheld-2026-06-05.md`. Commit it.

## Week 2: gate the budget in CI before it regresses

The week-1 audit gets the project under budget *today.* Week 2's job is making sure week 5's content drop doesn't push it back over.

Add the CLI to CI. The [JSON output](../../bin/impl/asset-audit/README.md) is built for this.

```yaml
# .github/workflows/asset-budget.yml
jobs:
  asset-budget-switch:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { lfs: true }
      - uses: oven-sh/setup-bun@v2
      - run: gamestack-asset-audit --platform switch-handheld --format json --out switch.json --strict
      - if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: asset-audit-switch
          path: switch.json

  asset-budget-mobile:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { lfs: true }
      - uses: oven-sh/setup-bun@v2
      - run: gamestack-asset-audit --platform mobile-hi --format json --out mobile.json --strict
```

`--strict` exits non-zero on P0 and P1. PRs that add an oversized texture fail the build before merge. The audit on `mobile-hi` re-uses the same constraint set as Switch (1024 texture cap, 256 MB atlas), so a single fix usually clears both targets.

Now you can sleep through week 3.

## Week 3: art direction sanity check at the smaller texture sizes

Before week 4's cert work, confirm the 1024-max textures still look right. The asset audit got them under budget; the art direction skill checks they still read.

```
/plan-art-direction
```

The [Art Director](../../skills/plan-art-direction/SKILL.md) re-rates the plan with the new platform constraints in mind:

```
RATINGS (0-10)
  Style in one sentence:       9 — "Tideglass: a wet, low-saturation pixel
                                    coastline at dusk." Held up.
  References specificity:      8 — Sword & Sworcery + Year Walk; both 1:1
                                    scaling references for low-res.
  Color discipline:            9 — 32-color palette, hex codes locked.
                                    Re-quantization at 1024 max preserves it.
  Silhouette readability:      7 — Was 9 at 4096. At 1024 the keeper's coat
                                    silhouette merges with the lighthouse
                                    door frame at 80% of screen scale.
                                    Action: re-key the coat outline 1px wider.
  Asset budget realism:       10 — Switch + mobile-hi both pass the audit
                                    on the same asset set.
  Animation language:          8 — 12 fps explicit; snap on impact policy.
                                    No drift from the new texture sizes.
  VFX policy:                  8 — Particles atlased separately; budget set.
  AI-slop resistance:          9 — No generated reference; human moodboard.

WHAT 10 LOOKS LIKE
  Silhouette readability: keeper's coat outline 1px wider in the dusk-lit
  interiors specifically. The exterior reads fine.

DESIGN DOC EDITS
  - Add: "Keeper sprite re-key for 1024 builds: coat outline +1px on
    interior scenes (5 sprites)."
```

One sprite-sheet pass. Half a day. The art direction holds across all three targets, which is the load-bearing claim that makes the multi-platform launch credible.

## Week 4: cert-readiness for Switch (and a reminder about the others)

Steam doesn't have a cert. Mobile stores have a review process but it's not TRC-class. Switch lotcheck *is* TRC-class, and the [cert-readiness skill](../../skills/cert-readiness/SKILL.md) is the lens.

The dev's `CLAUDE.md` says the game's phase is `Polish` — not yet `Cert`. The skill will surface that. Run it anyway, because the point is to know *what* to fix before phase transition, not to wait until phase transition to discover four weeks of cert work.

```
/cert-readiness switch
```

```
PHASE NOTE: project phase is "Polish", not "Cert". Running anyway as
            requested. Findings will be a pre-cert delta list, not a
            submission-readiness verdict.

PLATFORM: Switch
CHECKLIST VERSION ON FILE: NOT FOUND — P0
            Download the current lotcheck PDF from Nintendo Developer
            Portal and store at docs/cert/switch-lotcheck-vN.N.pdf.

BUILD: 7c4d2e1 (Polish phase, not Cert)

PASS  PASS-CODE-ONLY  NEEDS-LIVE-TEST  FAIL-P0  FAIL-P1  N/A
  2        3                2             1        2      0

──────────────────────────────────────────
CATEGORY                        VERDICT          DETAIL
──────────────────────────────────────────
Controller modes                PASS_CODE_ONLY   Pro Controller + Joy-Con handled
                                                 in Assets/Scripts/Input/PadGlyphs.cs;
                                                 needs live test on devkit.
Sleep / resume                  FAIL_P1          OnApplicationPause is wired in
                                                 GardenController.cs but the save
                                                 system writes are non-atomic.
                                                 Suspend during write WILL corrupt.
Parental controls               NEEDS_LIVE_TEST
Suspend during write            FAIL_P0          File.WriteAllBytes used at
                                                 Assets/Scripts/Save/SaveSystem.cs:43
                                                 Replace with File.Replace pattern
                                                 + tmp+rename atomic write.
Memory ceiling                  PASS_CODE_ONLY   Switch runtime estimate 1.8 GB
                                                 against 3.2 GB usable. Confirm on
                                                 devkit; OOM not yet observed.
Boot time                       NEEDS_LIVE_TEST
Localization                    FAIL_P1          Currently English-only. If shipping
                                                 lotcheck with multi-language
                                                 marketing, every string must
                                                 localize. Single-language ship is
                                                 valid; declare it.
Age rating consistency          PASS             eShop draft + in-game splash +
                                                 parental panel all show E10+.

UNIQUE-TO-GAME ITEMS
  - Photosensitivity warning: NOT PRESENT — Tideglass has a lightning storm
    in chapter 9. Add a warning + an in-options "reduce flashes" toggle.
    (FAIL_P1)

ACTION LIST (prioritized)
  P0 — fix before lotcheck submission
    1. Replace non-atomic save in SaveSystem.cs:43 with File.Replace pattern.

  P1 — strongly recommended
    1. Lock save writes during OnApplicationPause (extend suspend handling).
    2. Add photosensitivity warning + reduce-flashes toggle.
    3. Declare localization scope: ship English-only OR add the planned langs.

  NEEDS_LIVE_TEST — run on devkit
    1. /playtest 04-cert-controller-disconnect on switch
    2. /playtest 05-cert-save-fuzz on switch
    3. Boot time measurement (lotcheck threshold: ~30s cold start)
    4. Parental control respect test

  SUBMISSION READINESS
    Switch: BLOCKED — atomic save fix required + 3 live tests pending.
```

This is the most valuable output of the six-week run. A solo dev who skipped the cert-readiness lens would discover the atomic-save issue *at lotcheck rejection*, in week 8 or 9, having shipped Steam already and now facing a week of cert turnaround. Catching it in week 4 makes it a half-day fix.

Note the skill's [explicit limit](../../skills/cert-readiness/SKILL.md): this is not a substitute for the NDA-protected lotcheck PDF. The skill says so at the top of every report. Download the actual checklist, drop it at `docs/cert/switch-lotcheck-vN.N.pdf`, and re-run.

The Steam launch in 6 weeks doesn't require cert-readiness. But run it for the iOS / Android-equivalent store policies (subscription policy, IAP policy if any, age rating consistency). Apple and Google's review will catch missing privacy declarations and crash-on-launch but not save corruption.

## Week 5: gate cert-readiness in CI too

Same shape as the asset-audit CI gate, on the same JSON contract from the [cert-checklist CLI](../../bin/impl/cert-checklist/README.md).

```yaml
# .github/workflows/cert-readiness.yml
jobs:
  cert-switch:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: gamestack-cert-checklist --platform switch --format json --out cert-switch.json
      - if: failure()
        uses: actions/upload-artifact@v4
        with: { name: cert-switch, path: cert-switch.json }
```

Don't run with `--strict` yet — the project is still Polish-phase, P1 noise will fail every PR. Run with default thresholds (P0 only) until the phase transition, then flip strict on for the cert-phase weeks.

## Week 6: launch Steam, hold Switch + mobile for July

Steam ships on 2026-07-17 as planned. The audits and the cert-readiness work done in weeks 1–5 mean the same content is also nearly ready for Switch and mobile-hi — but "nearly ready" is not "ready."

Realistic post-Steam timeline:

```
2026-07-17  Steam launches
2026-07-18  Hotfix window. Watch refund rate, crash reports.
2026-07-25  /cert-readiness switch again — now Cert phase.
            Run /playtest 04-cert-controller-disconnect on devkit.
            Run /playtest 05-cert-save-fuzz on devkit.
2026-08-08  Switch lotcheck submission (assumes 2 weeks of cert fixes).
            Lotcheck turnaround: 2-3 weeks.
2026-08-22  Mobile-hi soft launch (iOS TestFlight + Google internal track).
2026-09-12  Switch eShop + mobile public release (target).
```

The version that didn't go through the asset-audit / cert-readiness loop submits to lotcheck in week 7, fails on atomic-save, eats a 2-week resubmission cycle, and slips Switch to October.

## What just happened

In six weeks of pre-launch the project went from "Steam-only, vaguely hoping for Switch" to:

- A documented target list (`design/launch-targets.md`) that cut web up front and downgraded mobile-lo to mobile-hi — both calls made with budget math, not vibes.
- A Unity importer-settings pass that brings the same asset set under [`switch-handheld`](../../bin/impl/shared/platforms.ts) and [`mobile-hi`](../../bin/impl/shared/platforms.ts) budgets without touching source art.
- CI gates on [`gamestack-asset-audit`](../../bin/impl/asset-audit/README.md) that fail PRs which regress the budget on either platform.
- A Switch [`cert-readiness`](../../skills/cert-readiness/SKILL.md) pre-pass that caught the non-atomic save corruption pattern four weeks before lotcheck.
- A localization decision (English-only for first launch) declared explicitly so it's not a surprise.
- An art direction recheck ([`/plan-art-direction`](../../skills/plan-art-direction/SKILL.md)) confirming the 1024-max textures still read.

Without the loop, the same six weeks usually produces: a Steam launch, then "let's see about Switch later," then a discovery in August that the save system isn't lotcheck-safe, then a Q4 Switch slip.

The skills don't ship the game on three platforms. They surface the calls that have to be made, in the order that makes them cheap.

## What comes next

- **Day after Steam launch.** [`/post-launch-monitor`](../../skills/post-launch-monitor/SKILL.md) daily for 30 days. Refund rate is the signal that says "fix this before Switch sees it."
- **Week 7.** [`/cert-readiness switch`](../../skills/cert-readiness/SKILL.md) once the project's `CLAUDE.md` declares `Cert` phase. This time the verdict counts.
- **Week 7.** Cert-class playtest scenarios on a real devkit. The CLI [doesn't execute scenarios](../../bin/impl/cert-checklist/README.md); the [`/playtest`](../../skills/playtest/SKILL.md) skill does.
- **Week 8.** Submit to Nintendo. Do not let the AI auto-upload to the partner portal; that's an explicit human-in-the-loop step.
- **Week 10.** Mobile-hi soft launch via TestFlight + Google internal track. iOS / Google review is fast but unforgiving on crash-on-launch — run [`/critique --lens=perf`](../../skills/critique/SKILL.md) on a 4-year-old Android device before submission.

## Related

- [`/asset-audit`](../../skills/asset-audit/SKILL.md) — the Technical Artist walked through here for milestone audits.
- [`gamestack-asset-audit`](../../bin/impl/asset-audit/README.md) — CLI for CI budget gating.
- [`/cert-readiness`](../../skills/cert-readiness/SKILL.md) — Platform Cert Officer for Switch / PS5 / Xbox pre-pass.
- [`gamestack-cert-checklist`](../../bin/impl/cert-checklist/README.md) — CLI for CI cert gating.
- [`/plan-art-direction`](../../skills/plan-art-direction/SKILL.md) — the recheck that confirms art reads at the smaller texture sizes.
- [`/critique --lens=perf`](../../skills/critique/SKILL.md) — perf budget after asset changes.
- [`/playtest`](../../skills/playtest/SKILL.md) — cert-class scenarios on devkits.
- [`/publish`](../../skills/publish/SKILL.md) — the submission flow once cert passes.
- The previous tutorial: [howto-first-game-in-an-hour](howto-first-game-in-an-hour.md).
