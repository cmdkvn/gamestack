# Case study: shipping a Godot 4 roguelite as a solo dev

The promise of gamestack at studio scale is *the orchestra without the personnel.* This case study walks one solo developer's 33-week arc — from a pitch napkin through Steam launch and the first month of post-launch — and shows where each gamestack skill actually mattered.

The game is **Bramble** — a Godot 4 pixel-art roguelite where every run is a single 8-minute descent through procedural thorn-mazes. The verb is *cutting*, not killing. The dev is a former web developer (TypeScript, three years of React) with one year of Godot under their belt, shipping to Steam on PC + Steam Deck on day 1. No console launch; that's deferred to post-v1 if the game lands.

Don't take the timeline literally. The point is the *shape* of the 33 weeks and which skills did real work at which moments. The numbers at the end are realistic-feeling, not real.

## Setup: the dev, the game, the Godot tax

The dev — call them M — built a portfolio of three React-based browser games during the pandemic. They picked Godot a year ago because GDScript reads like TypeScript without the build step and the editor doesn't require a $2,000 Mac. They've shipped a 30-minute itch.io demo of a previous prototype that didn't find an audience. Bramble is their first real attempt at a commercial release.

The Godot-specific tax M is going to pay regardless of gamestack:

- **GDScript vs C#.** They picked GDScript for iteration speed. C# would give them better tooling but slower hot-reload and a Switch port path that doesn't exist yet anyway. The decision is correct for this game; it would be wrong for a future ECS-heavy strategy game.
- **Signal leaks.** Godot's signal system is the engine's most beautiful feature and its most common foot-gun. A node connects a signal in `_ready()`, queue-frees, the publisher doesn't, and the next emit hits a freed object. M has hit this twice already in side projects. It will hit them again on Bramble at week 9, and it will be `/code-review-gamestack` that catches it before playtest.
- **`.tres` resource management.** Godot's resource system is glorious for shared data but every `.tres` file is a tiny graph of UIDs. Move a script, rename a file, and inspector references break silently. M has a personal rule: never rename a script after week 3.
- **The addon ecosystem.** Godot 4.x has a smaller third-party landscape than Unity. M will use four addons total: gamestack (the SDK), `dialogue_manager`, a screen-shake helper, and `gut` for unit tests. Every addon is a future-maintenance liability; M is right to keep the count low.

The rest of the case study assumes you've installed gamestack via the [README's 30-second install](../../README.md#install--30-seconds) and the [Godot SDK addon](../../engines/godot/README.md) — both are prerequisites for the later phases.

## Phase 1: pitch (week 1)

### Day 1 — `/design-jam`

M opens Claude Code in `games/bramble/` and starts where every gamestack arc starts:

```
/design-jam I want to build an 8-minute roguelite descent. Pixel art. Godot.
```

The Creative Director walks the six forcing questions. M's first answer to "core verb in three words" is "fighting enemies." The skill pushes back — every roguelite is "fighting enemies"; that's not a pitch. After thirty minutes the answers settle:

```
1. Core verb in three words?
   → "Cutting through thorns."
2. One-screen pitch?
   → Bramble: every run is a single 8-minute descent through procedural
     thorn-mazes that grow back if you take too long. Your tool is a
     cutter, not a sword. You're not killing things; you're clearing
     a path.
3. Target player + what they do instead today?
   → Hades players who want a shorter loop. Currently playing Vampire
     Survivors / Brotato but missing the deliberate movement.
4. Kernel of fun?
   → The snap of the cutter through a vine, when the path opens.
5. Two X-meets-Y references that overlap?
   → Hades × Downwell. Downward pressure + tight verb.
6. 8-week cut list?
   → 8 weeks: one biome, one cutter, ten thorn variants, three
     enemies, one boss. NOT 8 weeks: multiple biomes, weapon trees,
     meta-progression hub, narrative arc.
```

The cut list is the load-bearing artifact. M commits `design/pitch.md` and the cut list becomes the contract for the rest of the arc — every time M is tempted to add a weapon tree at month 4, they re-read line 6 and remember the deal.

### Day 3 — first playtester

M shows the pitch (just the text) to a friend who plays roguelites. The friend asks: "wait, so I'm *gardening?*" M nearly throws away the pitch on the spot. After a walk, they come back and decide: yes, partially. The dread of the thorns growing back is half the pitch. The gardening framing is fine. The pitch survives intact.

This is not a `/design-jam` finding — it's a reminder that the pitch's job is to survive contact with a real person. The Creative Director can pressure-test the words; only a human can pressure-test the *vibe*.

## Phase 2: plan (week 2–3)

### Week 2, Monday — `/plan-creative-director`

```
/plan-creative-director
```

The skill reads the pitch and picks a mode. M expects **Hold Scope**. The skill picks **Reduction**:

```
MODE: Reduction.

Reasoning:
  - Pitch already has a tight scope, but the 8-week cut list still includes
    "three enemies, one boss." For a verb (cutting) that hasn't been built
    yet, three enemies is the wrong number. Build one. Make it feel right.
    Add the others if the first survives playtest.
  - "Procedural thorn-mazes" is a category of work, not a feature. The
    procedural generator is a 3-month side quest if you let it be. Lock
    "procedural" to "hand-authored chunk stitching" before week 4.

Proposed edits to design/pitch.md:
  - Cut list: "three enemies, one boss" → "one enemy archetype (Thorn-tick).
    Boss deferred to vertical slice if archetype lands."
  - Cut list: "procedural thorn-mazes" → "chunk-stitched mazes from 12
    hand-authored 4×4 tile chunks."

Risks:
  - The cutter is a verb people are not familiar with. The first playtest
    needs to answer: does cutting feel different from attacking, or are
    you accidentally building a sword that cuts vines?
```

M accepts. The "is the cutter a sword?" risk gets pinned to the top of `design/pitch.md`. It will resurface, painfully, at the week-5 prototype playtest.

### Week 2, Wednesday — `/plan-game-design`

```
/plan-game-design
```

The Lead Game Designer fills the skill-curve table for an 8-minute roguelite:

```
CORE LOOP (30 seconds):
  1. Look at the path. Read the thorn density.
  2. Choose: cut the cheap thorn (faster), cut the expensive one (safer),
     or dodge through.
  3. Execute. Watch the thorns grow back behind you.
  4. Repeat until the depth meter hits 8 minutes — descend to next zone.

SKILL CURVE:
  Minute 1:   "what does this button do" — discover the cutter swing.
  Hour 1:     read thorn-tick spawn patterns; chain cuts; manage cooldown.
  Hour 10:    optimize per-seed routes; speedrun individual chunks; learn
              which thorns are bait.
  Hour 100:   leaderboard-grade route memorization (if leaderboards exist).

KILL LIST:
  - "Weapon variety" — re-enters via the kill list. The cutter IS the game.
  - "Meta-progression unlocks" — deferred to v1.1 unless the game has not
    found its audience by then.
  - "Narrative" — descent IS the narrative. No dialogue. No NPCs.
```

That last line — "no dialogue, no NPCs" — saves M from `/dialogue-write` and `/dialogue-review` for the entire arc. The case study has nothing to say about those skills because Bramble doesn't have words.

### Week 3, Tuesday — `/plan-tech-design`

This is where Bramble's life-saving moment happens. M doesn't know it yet.

```
/plan-tech-design
```

The Technical Designer locks the architecture:

```
ENGINE: Godot 4.3.stable (lock the patch level — addon compat matters)
LANGUAGE: GDScript (with thin C# escape hatch documented but unused)

STATE MACHINES (ASCII, player):
  IDLE ──input──> WIND_UP ──30ms──> CUTTING ──hitbox──> RECOVER ──> IDLE
                                              \
                                               miss──> RECOVER ──> IDLE

SAVE FORMAT — load-bearing decision:
  Path:   user://save_run.json (atomic via temp+rename)
  Schema: {
    "version": 1,                  ← NON-NEGOTIABLE
    "seed": int,
    "depth_m": int,
    "deck": [...],
    "runtime_state": {...}
  }
  Migration: if save.version < CURRENT_VERSION, run migrate_<n>_to_<n+1>().
  Atomic write: write to user://.save_run.json.tmp, fsync, rename.

FRAME BUDGET:
  Target: 60 fps on Steam Deck (16.67 ms).
  Allocation: 4ms physics, 6ms scripts, 4ms render, 2.67ms slack.
  Anything over 8ms in a script call gets a TODO-perf comment.

RISKS surfaced:
  - GDScript signal connections in _ready() are the engine's #1 leak
    source. Document a teardown rule per node: every connect() pairs
    with a disconnect() in _exit_tree(), unless connect is on `self` or
    an owned child.
  - Resource (.tres) UID drift after rename. House rule: no script
    rename after week 3.
```

The `"version": 1` field will be load-bearing five months later. M will remember adding it; they will not remember why. Their week-25-self will thank their week-3-self when the cutter unlock data structure has to change shape mid-development.

M doesn't bother running `/plan-art-direction`, `/plan-narrative`, `/plan-level-design`, or `/plan-audio-direction` yet. The cutter doesn't exist in code. Polish-the-plan-before-the-verb-works is a trap; M correctly skips it.

## Phase 3: prototype (week 4–6)

### Week 4 — `/scene-prototype`

```
/scene-prototype "Bramble — single chunk, player, cutter, one thorn-tick"
```

The Engine Builder detects Godot from `project.godot`. The output is Godot-flavored, not Unity-flavored:

```
GENERATED FILES
  scenes/main.tscn                          Empty scene root with Player
                                            and ChunkContainer placeholders.
  scripts/player/player.gd                  Player controller. State machine
                                            stub matching tech-design.
  scripts/player/cutter.gd                  Cutter logic + signal:
                                            `cutter_landed(target, kind)`.
  scripts/world/chunk.gd                    Chunk loader; placeholder
                                            tilemap reference.
  scripts/world/thorn.gd                    Thorn node — exports `kind`,
                                            `cut_cost_ms`, regrows after
                                            timer.
  scripts/enemies/thorn_tick.gd             One enemy. Patrols vines,
                                            attacks on proximity.
  resources/cutter_config.tres              Resource for cutter tunables
                                            (wind-up, recovery, damage).

SETUP CHECKLIST (bramble-setup.md)
  1. Open scenes/main.tscn in Godot.
  2. Drag Player.tscn into the tree under "Player".
  3. Drag Chunk.tscn under "ChunkContainer".
  4. In CutterConfig.tres: set wind_up_ms=30, recover_ms=120, damage=1.
  5. Press F5. WASD to move. SPACE to cut. Console logs cut hits.

KNOWN GODOT GOTCHAS (pinned to top of file)
  - Don't rename these scripts after week 3 (tech-design rule).
  - Every connect() in this code pairs with a disconnect() in
    _exit_tree(). Search for `connect(` before merging anything.
  - `cutter_config.tres` UID lives in the file. Don't `mv` the file.
```

The scaffolding compiles clean. M spends the rest of week 4 wiring placeholder sprites, a basic camera follow, and the simplest possible thorn-tick AI. By Friday they can press space and hear a satisfying *snap* through the in-engine speaker placeholder.

### Week 5, Friday — `/find-the-fun`

M has lived inside the prototype for three weeks. They've shown it to two friends, both of whom said "yeah, this is cool" without elaborating. M can't tell if "cool" is real or polite.

```
/find-the-fun
```

The Prototype Critic asks the four questions:

```
1. Name one specific working moment.
   → "The two-thorn diagonal cut at the entrance of chunk-07. The
      cutter swing hits both vines in the same arc and the path opens
      in one motion."
   ✓ Specific. Real. The kernel might be here.

2. Name one specific bad moment.
   → "Killing the thorn-tick. The animation says 'sword.' The hitbox
      says 'sword.' The damage number floats up. It's a small bad
      Vampire Survivors and I have a worse cutter for it."
   ✓ Real. This was the risk pinned at week 2.

3. What did playtesters do with their hands and face?
   → Friend 1 leaned forward at chunk-07 and didn't blink. Friend 2 spent
      45 seconds trying to kill the thorn-tick before realizing they could
      just walk past it.
   ✓ Two different sessions, two different signals. Trust both.

4. How long have you lived inside the prototype?
   → 3 weeks.
   ⚠ You're past the "fresh eyes" window. The two friends are credible
     because you aren't anymore.

KERNEL: present and located. The "diagonal two-thorn cut" is the verb.
        The cutter, used as a cutter, is the game.

DEAD MECHANICS:
  - Thorn-tick combat as currently implemented. It re-instantiates the
    sword-game you said you weren't building. Cut it OR redesign it as a
    PATH OBSTACLE, not an enemy.

THREE DIRECTIONS:
  A — Deepen: lean into the two-thorn cut. Add five chunk patterns
      that reward arc-management. Hours of work; high-confidence.
  B — Reshape combat: thorn-ticks no longer take damage from the cutter.
      They're terrain. They die from being cut OUT of position — sever
      the vine they're standing on, they fall. New verb: positional
      cutting.
  C — Cut combat entirely: zero enemies. The thorns ARE the antagonist.
      Pure descent against time and density.

RECOMMENDED: B this week, then judge whether C is needed.
```

M does B. It takes one week. The thorn-tick now stands on a vine; cutting the vine drops the thorn-tick into the abyss below; the kill animation is *the absence of the thorn-tick.* The verb is now load-bearing for both navigation and combat, and the cutter is decisively not a sword.

M writes the finding to `playtest/find-the-fun-2026-07-10.md`. They will re-read it at week 18 when they're tempted to add a second weapon. They will not add it.

### Week 6 — closing the prototype

The week-6 milestone is "the prototype is a real game for 90 seconds." Movement, cutter, two chunk patterns, three thorn variants, two thorn-tick patterns, one piece of placeholder music looping. The build runs at 60 fps on M's Steam Deck. The prototype is shippable as an itch.io demo if M decided to stop here.

They don't stop here.

## Phase 4: vertical slice (week 7–12)

### Week 7 — installing the Godot SDK

This is the moment M installs the gamestack Godot SDK so that `/playtest` can drive the build directly.

```bash
ln -s ~/src/gamestack/engines/godot/addons/gamestack \
      games/bramble/src/addons/gamestack
```

Then in Godot: **Project > Project Settings > Plugins > gamestack > Enable**. The autoload registers. M expects to write the `GameStack.expose()` calls themselves; they do. Five minutes of work in `scripts/player/player.gd`:

```gdscript
func _ready() -> void:
    GameStack.expose(self, "depth_m", "run", Callable(self, "get_depth"))
    GameStack.expose(self, "hp", "player", Callable(self, "get_hp"))
    GameStack.expose(self, "cutter_state", "player",
                     Callable(self, "get_cutter_state_str"))
    GameStack.input_injector.on_input.connect(_on_external_input)
```

Press F5. Hit `http://127.0.0.1:7332/health` in a browser. Green. The SDK is reachable. `/playtest` will work.

### Week 8 — `/balance-review` on the loot curve

The vertical slice has loot now — three cutter modifications M is calling "cutter cards" (because not calling them that would be lying). Each card is in `data/cutter_cards.json`:

```
/balance-review data/cutter_cards.json
```

The Systems Designer pulls the table and runs Monte Carlo on 5,000 simulated runs:

```
SYSTEM: cutter cards (3 cards)
SOURCE: data/cutter_cards.json

MONTE CARLO — 5000 simulated runs

CARD       PICK RATE   AVG DEPTH   WIN RATE   TIME-TO-CLEAR (CHUNK 04)
serrated     58%          720m       42%          5.4s
wide-arc     31%          640m       28%          6.1s
quickdraw    11%          610m       24%          6.8s

FINDING 1 — Dominant strategy.
  serrated dominates wide-arc on chunk types with single-thorn approaches
  (8 of 12 chunks). Pick rate 58% with no card-trade-off-point above 35%.

FINDING 2 — Dead choice.
  quickdraw is strictly worse than serrated on every chunk where the
  player is reading thorn density and pacing the cut. The pick rate of
  11% is "people are still trying it because they don't believe it";
  by run 50 the player picks serrated by reflex.

PROPOSED NUMERIC EDITS
  Option A: nerf serrated — base damage 3 → 2; chunks 06, 09, 11 require
            two cuts on the marquee thorn.
  Option B: buff quickdraw — wind-up 30ms → 0ms makes it the right card
            for high-density chunks (12, 13, 14). New trade-off: speed
            vs single-thorn power.
  Option C: rework wide-arc — currently a "kind of like serrated" card.
            Make it the ONLY card that hits two thorns in one swing.
            Pick rate model predicts it climbs to 40%.

  Recommended: B + C. Don't nerf the card that feels good (serrated);
  raise the others to its level.
```

M accepts B and C. The vertical-slice loot curve goes from "one card and two also-rans" to "three cards with one decision per run." This finding alone would justify the gamestack install fee, if there were one.

### Week 9 — `/playtest` and the signal-leak bug

M runs the first SDK-driven playtest scenario.

```
/playtest 01-prototype-first-minute
```

The QA Lead probes `/health`, gets a green response, and loads the scenario:

```
SCENARIO: 01-prototype-first-minute (godot)
  ✓ GET /state                  OK   scene=Main, fps=60
  ✓ wait_for_state run.depth_m>=0   OK   1.1s
  ✓ input Keyboard:Space:Press  OK
  ✓ wait 0.5s                   OK
  ✓ assert_state player.cutter_state="recovering"   PASS
  ✓ screenshot 01-first-cut.png OK   12 KB
  ✓ snapshot pre-descent        OK   id=snap-1
  ✓ input Keyboard:S:Press      OK   (descend)
  ✓ wait 30s                    OK
  ✗ assert_state player.hp>0    FAIL  actual=0
    Hypothesis: dying inside snapshot window. Re-run after movement tuning.
```

The death is expected — M hasn't tuned thorn-tick spawn density yet. The scenario surfaces the right signal: the depth meter is climbing, the cutter state machine is ticking, the snapshot/restore loop works. The SDK contract is live.

The week-9 problem comes later. M runs the prototype a hundred times. Something starts feeling wrong around run 60 — the cutter feels mushy, the screen-shake is subtly off-rhythm. They can't tell if it's fatigue or a bug. They suspect fatigue.

```
/code-review-gamestack scripts/player
```

The Senior Gameplay Engineer walks the directory. It finds:

```
FINDING 1 — Signal leak. scripts/player/cutter.gd:47
  cutter_landed.connect(on_landed) is called in _ready().
  The cutter node is queue_free()'d when the player swaps weapon (yes,
  even with the cut-list rule, there is a swap-cutter prototype branch).
  There is no disconnect() in _exit_tree(). Subscribers accumulate
  across cutter swaps. By run 60 the screen-shake callback is firing
  multiple times per cut, decoupled from the visible swing.

  Auto-fix proposal: add to scripts/player/cutter.gd:_exit_tree():
    if cutter_landed.is_connected(on_landed):
      cutter_landed.disconnect(on_landed)

  Apply? (yes / no)
```

M says yes. The screen-shake snaps back to feeling normal. They write the lesson immediately:

```
/learn
```

```
TYPE:   bug-pattern
WHEN:   2026-08-21; week 9 vertical slice
LESSON: Godot signal leaks compound silently across object respawns.
        Every connect() outside _ready()-of-owned-children needs a
        paired disconnect() in _exit_tree(). The symptom is "the
        game feels off after the player has been playing a while" —
        rerun /code-review-gamestack BEFORE blaming fatigue.
```

This learning will surface again at week 26. M will recognize it.

### Week 10–12 — closing the vertical slice

The remaining three weeks are content work. Two more chunk authors (M's friend agreed to draw thorn-bushes for credit on the title screen), three additional enemy variants under the new "no-combat-is-the-combat" framing, the first 2-minute build that doesn't crash. M runs `/find-the-fun` again at the end of week 12:

```
KERNEL: still located. The "diagonal two-thorn cut" is now a vocabulary
        of about six recurring patterns. The variations carry hour 1.

DEAD MECHANICS:
  - The "boss" stub from the original pitch. After 12 weeks of building
    against the no-combat reframe, the boss does not have a place. Cut
    it permanently or defer it to v1.1.

RECOMMENDED: cut it. The game's identity is the descent, not the arena.
             A boss converts the descent into a Hades fight at the end
             and dilutes both.
```

M cuts the boss. The pitch's original cut list said the boss might be deferred. It is now formally deferred — possibly forever.

## Phase 5: production (week 13–22)

### Week 13 — wiring CI

The vertical slice is locked. The next 10 weeks are content production: more chunks, the second biome that opens after the first descent finishes, the music loop M's friend is composing, the sound effects that will replace the placeholder SFX. M's instinct is to wait until "the end" to audit assets. That's how indie games ship with 12 GB of uncompressed PNGs.

```bash
# .github/workflows/asset-audit.yml
jobs:
  asset-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: gamestack-asset-audit --project games/bramble --platform pc \
             --format both --out asset-audit --strict
      - if: always()
        uses: actions/upload-artifact@v4
        with: { name: asset-audit, path: asset-audit.* }
```

The first CI run fails. Three textures are over 2048×2048. M finds them — early concept art that got committed to the wrong folder. The fix is to move them to `art-source/` (which is gitignored) and re-export at the correct resolution. The CI flips green.

From this point forward, every PR that bloats the assets fails before M can merge it. The `gamestack-asset-audit` CLI is doing the same work as the [`/asset-audit`](../../skills/asset-audit/SKILL.md) skill, just continuously.

### Week 17 — `/perf-benchmark` catches a regression

M's friend ships the second-biome music loop and a particle-system upgrade to the cutter trail. The build still runs. M is about to merge. Then:

```
/perf-benchmark
```

The Performance Engineer captures a snapshot, diffs against the baseline at `playtest/perf/baseline.json`:

```
SNAPSHOT — 2026-09-25
  Scene: bramble-test-deck-baseline
  Platform: Steam Deck (handheld)
  Build mode: release

METRIC                BASELINE     CURRENT      DELTA
avg fps                  60.0        51.4       -14%   REGRESSED
99th-pct frame time      18ms        28ms       +56%   REGRESSED
0.1th-pct frame time     22ms        61ms      +177%   REGRESSED  ← stutter
draw calls               94          103        +10%
gc-equivalent (GDScript) 2KB/f       2KB/f      flat
peak memory              412MB       418MB      +1.5%

REGRESSION CONFIRMED on 0.1th-pct frame time + avg fps.

HYPOTHESIS
  The cutter trail particle system was upgraded from 16 → 128 emitters
  per cut. The 0.1th-pct spike correlates with cut events.
  Investigation path:
    1. Check scripts/player/cutter_trail.gd for emitter count.
    2. Profile a 30-second descent with the Godot built-in profiler.
    3. Confirm GPU vs CPU bound — on Steam Deck this matters.

FIX PROPOSAL (not auto-applied)
  Lower emitter count to 48. Re-profile. If still regressed, swap to
  a CPU-driven trail mesh.
```

M lowers the emitter count to 48. Re-runs `/perf-benchmark`. Avg FPS recovers to 58. 99th-pct frame time drops to 19ms. They merge. The particle change would have shipped if M hadn't run the benchmark; the Steam Deck players would have noticed.

This is the kind of regression that a Unity dev would have caught with Profile Analyzer and a Godot dev without gamestack would have caught at *the next playtest in three weeks*, by which point three more PRs would have piled on top and the bisect would take a day. The weekly cadence catches things at the source.

### Week 22 — production wrap

Ten weeks of content production. Sixteen chunk patterns. The second biome opens after first descent. Sound effects in. Music in two layers (calm-thorn-light, dense-thorn-heavy) that crossfade based on local thorn density — an idea M would not have had without the music friend pointing out that Bramble's pacing screams for layered audio. The build runs in 8-minute descents end-to-end. M plays one full descent, doesn't die, and feels the game.

This is also the moment M is supposed to do something hard: lock the scope and not add anything else.

## Phase 6: polish (week 23–28)

### Week 23 — `/game-feel-audit` finds over-juicing

M expects the audit to surface things that need *more* juice. The cutter has had hit-pause and screen-shake for months; nothing feels under-juiced. M doesn't expect what the Polish Coach finds:

```
GAME-FEEL AUDIT — Bramble

VERB: cutter swing on thorn
  Animation curve:  4-frame snap on contact. ✓ Good.
  Hit-pause:        45ms on heavy thorn, 25ms on light. ✓ Good.
  Screen shake:     6px amplitude, 80ms. ✓ Good.
  Particle burst:   48 emitters. ✓ Good (post regression fix).
  Audio sweetener:  cut-snap layered with vine-tear. ✓ Good.
  Camera response:  push toward cut direction by 4px. ✓ Good.

VERB: pickup (cutter card found)
  Animation curve:  ease-out scale-up over 200ms. ✓ Good.
  Hit-pause:        80ms.                            ⚠ Long for a pickup.
  Screen shake:     8px amplitude, 240ms.            ✗ OVER-JUICED.
  Particle burst:   120 emitters.                    ✗ OVER-JUICED.
  Audio sweetener:  layered drum + chord + sparkle.  ⚠ Three layers.

OVER-JUICING DETECTED on pickup.
  The pickup verb has more polish than the cutter verb. The pickup is a
  pause: you stop, you choose, you continue. The juice is masking the
  fact that there is NO CHOICE in 31% of cases (the dominant-card finding
  from week 8 came back as a soft pattern in the playtest data).

  When over-juicing is loud and the underlying verb is thin, players
  feel a vague dissatisfaction they cannot name. They will write Steam
  reviews that say "the loot doesn't feel satisfying" without knowing
  why.

PROPOSED EDITS
  - Pickup screen shake: 8px/240ms → 3px/120ms.
  - Pickup particles: 120 → 36.
  - Pickup audio: drop the sparkle layer.
  - Cross-reference week-8 balance-review: the dominant-card finding
    may have come back. Re-run /balance-review on data/cutter_cards.json.
```

M re-runs `/balance-review`. The buffs from week 8 mostly held; one card has drifted dominant again because of a tilemap change three weeks ago. M re-tunes. Then strips the over-juice from the pickup. Plays again. The pickup feels like a choice now, not a celebration of a choice.

The skill caught a problem M would have shipped. The Steam reviews would have said "loot is meh" and M would have spent two weeks adding loot effects when the actual fix was removing them.

### Week 25 — the save-format-version-field moment

M is implementing the cutter card unlock structure. The data shape has to change — the original schema had `unlocked_cards: ["serrated", "wide-arc"]`; the new one needs `unlocked_cards: [{"id": "serrated", "level": 2}]` for the post-descent progression they're adding.

Old saves break. M is one minute from shipping a migration that wipes save files. They open `save/SaveManager.gd`, see the line:

```gdscript
const CURRENT_VERSION = 1
```

…and remember the week-3 tech-design decision. They write `migrate_1_to_2()`:

```gdscript
static func migrate_1_to_2(data: Dictionary) -> Dictionary:
    var migrated = data.duplicate(true)
    migrated["unlocked_cards"] = migrated["unlocked_cards"].map(
        func(id): return {"id": id, "level": 1})
    migrated["version"] = 2
    return migrated
```

Tests pass. Old save files migrate cleanly. The week-3 decision saved a week-25 catastrophe. M never thanks `/plan-tech-design` out loud, but they think about it.

### Week 26 — the second signal leak

The week-9 lesson recurs. The boss-defer cleanup left an orphaned `boss_defeated` signal connection somewhere. M's screen-shake starts feeling off-rhythm. They recognize the symptom from the studio learning. `/code-review-gamestack` finds it in 30 seconds. Fix takes 10. Total time spent: 12 minutes.

Without the learning, this is a four-hour bug hunt. The learning system did exactly what it's for.

### Week 27 — `/onboarding-audit`

M times the prototype-to-first-cut path with the audit.

```
/onboarding-audit
```

```
ONBOARDING AUDIT — Bramble

TIMINGS
  First verb (cut):         47s    target ≤ 10s.   FAIL.
  First decision:           1:12   target ≤ 30s.   FAIL.
  First reward (first card): 3:40   target ≤ 60s.   FAIL.
  First failure:            8:10   target 5-10min.  PASS.
  "I get it":               12:00  target ≤ 15min.  PASS.

FRICTION COUNT
  - Studio splash (unskippable):        4.5s
  - "Press any key" screen:             until key
  - Settings prompt before first run:   if first launch
  - Cutter tutorial overlay:            8 modals, 2 must-be-dismissed
  - Story text crawl:                   18s

OPENING ALIGNMENT WITH (FUTURE) STEAM TRAILER
  Trailer leads with the descent.
  Game leads with 32 seconds of pre-descent screens.
  MISALIGNED — refund-risk pattern.

TOP EDITS (in priority order)
  1. First launch goes straight to the descent. No settings prompt;
     reasonable defaults (subtitles ON, screen shake medium, etc.).
  2. Story text crawl: skippable on press; cut from 18s to 7s default.
  3. Cutter tutorial: collapse 8 modals to 3, anchor to player actions
     not screens (cut your first thorn → 1 modal; reach the lower vine →
     1 modal; pick up first card → 1 modal). Total tutorial reading time:
     <12s.
  4. Studio splash: cut to 2s, skippable on input.

  Expected effect: time-to-first-cut drops from 47s → ~9s. Refund-risk
  drops from HIGH to MEDIUM (medium is the floor for any short-loop game).
```

M does all four. Time-to-first-cut drops to 11s — short of 9 but well under the 15-second threshold for a short-loop roguelite. The expected effect is real, and the friction count is now low enough that the trailer-to-game alignment story works.

### Week 28 — closing polish

Polish week 28 is mechanical. `/perf-benchmark` clean. `/asset-audit` clean. `/playtest 01-prototype-first-minute` and `02-quick-loop` both green. M plays the game for three full descents in a row without noting anything that needs fixing. They lock the build for pre-launch.

## Phase 7: pre-launch (week 29–32)

### Week 29 — `/steam-page-review`

The Marketing Lead reads the draft Steam page in `marketing/steam/`:

```
STEAM PAGE — Bramble — pre-launch draft

CAPSULES
  ✓ Header (460×215)          present
  ✗ Small capsule (231×87)    MISSING. The cart capsule is the most-seen
                              capsule on Steam; not having it is a
                              wishlist tax of ~5-10%.
  ✓ Main capsule (616×353)    present
  ⚠ Library hero (3840×1240)  present but the title sits over a busy
                              middle ground — illegible at thumbnail
                              size.
  ✗ Library logo              MISSING. The game will look unfinished in
                              every player's library.

TRAILER
  Length:      71 seconds.       ✓
  First 6 sec: 2s studio logo, 4s "Bramble" title card.   ✗ NO VERB.
               The first thing a wishlist-scrolling player sees is your
               studio name and the game's name. They see this for every
               game.
  Cut to verb: 0:08 — too late. Steam autoplay cuts at 0:12 on the
               storefront page tile; the verb must hit by 0:06.
  Pacing:      8 cuts in 71s. ✓ for the genre.

SHORT DESCRIPTION
  "Bramble is a fast-paced roguelite about cutting your way through
   procedural mazes of thorns. Every run is a single 8-minute descent."

  Word "fast-paced" is taxonomic noise — every roguelite Steam page
  has it. Replace with the verb: "cutting." Lead with the verb.

TAGS
  Have: Roguelite, Action, Pixel Art, Difficult, Indie.
  Top-5 reference (Hades + Brotato + Downwell + Vampire Survivors +
                   Loop Hero): all five have "Replay Value." Three have
                   "Procedural Generation." Four have "Singleplayer."
  Missing: Replay Value, Procedural Generation, Singleplayer.
  Has but might cut: "Difficult" — only one of the five references
                     uses it; reads as a deterrent on a 30-minute
                     wishlist scroll.

SCREENSHOTS
  Have: 6 screenshots, all at 1920×1080. ✓
  Variety: 5 are cutter-mid-swing; 1 is the pickup screen.
  ⚠ Need: at least 2 wide-establishing shots that show the descent.
          The current 6 read as "this is a screenshot of a swing" not
          "this is a game I want to play."

NEXT FEST FIT
  ✓ 8-minute loop is ideal for a 30-minute demo.
  ✓ The visible verb is a 5-second clip's worth.
  Recommended: enter the next Next Fest window. Builds wishlist
  conversion ahead of launch.

WISHLIST-CONVERSION RISK: MEDIUM-HIGH (mainly the missing small capsule
                          + library logo + trailer's slow first 6s).
```

M fixes all of it. The small capsule and library logo are 2 hours of work. The trailer recut takes a day. The screenshots take half a day. The tags are 30 seconds. The wishlist-conversion risk drops to MEDIUM, which is realistic for a debut indie.

### Week 30 — `/a11y-audit` for Steam Deck Verified

Steam Deck Verified isn't an accessibility cert — it's a controller + readability cert. But the high-failure categories overlap. M runs:

```
/a11y-audit
```

```
A11Y AUDIT — Bramble

TOP-4
  ✓ Remappable controls       (works in Settings; gamepad + keyboard)
  ⚠ Text scaling              UI scales to 1.3× cleanly; 1.5× clips
                              the cutter card description.
  ✗ Colorblind modes          MISSING. Cutter card rarity uses red/
                              green icons. Deuteranope test (8% of
                              players) cannot distinguish common from
                              rare.
  ✓ Subtitles / CC            game has no dialogue; SFX captions for
                              non-dialogue audio cues PRESENT.

STEAM DECK VERIFIED PROXIES
  ✓ Default control config      (gamepad-first, prompts via Steam Input)
  ⚠ Text size on 7" handheld    most UI passes; the cutter card
                                description is below the 9-pt floor
                                at Deck native resolution.
  ✓ Suspend/resume              Godot handles this by default; tested
                                via gamestack-playtest snapshot/restore.

ACTIONS
  - Add 4 colorblind palettes (Deuteranope, Protanope, Tritanope,
    high-contrast) with a settings toggle. ~1 day.
  - Bump cutter card description font size 12pt → 14pt at base; test
    1.5× scaling without clipping. ~half day.
  - Re-run /a11y-audit. Re-test on Steam Deck.

PUBLIC REPORT WRITTEN: docs/a11y-report.md
  → Will appear on the Steam page in v1.0.
```

M does both. The audit also generates the public-facing report, which goes on the Steam page. Steam Deck players (M's biggest demographic by a wide margin, M suspects) will see this and feel cared about. That's worth more than the wishlist-conversion-rate math says it is.

### Week 31 — Next Fest

M enters Next Fest with a 25-minute demo: two biomes, six chunks each, the first 4 cutter cards. They livestream once during the festival, awkwardly. The demo runs clean for ~600 players over the week (M is not a streamer, no audience pre-existed). Wishlist additions during the week: ~1,200. Demo retention to credits screen: 31%.

The 31% is the load-bearing number. For an 8-minute loop, retention measures whether the kernel landed. 31% means about a third of demo players finished a descent. That's a healthy signal for an unknown indie debut.

### Week 32 — final polish, pre-launch checklist

Bug fixes from the Next Fest feedback. One genuine pattern: players want the cutter to have a sound when it's *fully recovered* and ready to swing again. M adds a subtle audio cue. `/game-feel-audit` confirms it's calibrated against the existing cutter swing audio, not competing with it.

```
/cert-readiness pc
```

```
PLATFORM: PC (Steam) + Steam Deck
BUILD: 2026-11-14 release-candidate

PASS  PASS-CODE-ONLY  NEEDS-LIVE-TEST  FAIL-P0  FAIL-P1  N/A
  9        2                1             0        0      0

SUBMISSION READINESS: READY
  0 P0, 0 P1. 1 live test recommended (controller hot-swap on Deck).

Steam Deck-specific:
  ✓ Default keybinds map to gamepad
  ✓ UI legibility at 1280×800 Deck native
  ✓ Suspend/resume confirmed via /playtest save-fuzz scenario
  ✓ <60 second cold-boot to first frame
  ✓ No mouse-dependent UI (verified)
```

The PC "cert" isn't NDA-protected the way Switch is, but the discipline is the same. M sleeps the night before launch.

## Phase 8: launch (week 33)

### T-1 day — `/launch-day` rehearsal

M pulls the cert freeze pattern from the cert-walkthrough doc. PC doesn't require freeze the same way Switch does, but the discipline transfers — M `/freeze`s the build directory and the marketing assets.

The rehearsal is one `/playtest 05-cert-save-fuzz` and one `/perf-benchmark` against the release candidate. Both green. M closes the laptop early.

### Launch day, 10:00 ET — `/publish` and `/launch-day`

```
/launch-day
/publish target=steam version=1.0.0
```

The Release Engineer walks the gates:

```
PRE-PUBLISH GATES
  ✓ Cert verdict (PC + Deck Verified-proxy: READY)
  ✓ No P0 bugs                (playtest/regression/ smoke pass)
  ✓ Tests passing             (gut: 89/89 pass)
  ✓ Version unique            (v1.0.0 not tagged)
  ✓ Branch clean              (no uncommitted)
  ✓ Build = commit            (Builds/Linux + Windows + macOS from sha 7f3a91c)
  ✓ Not Friday-after-2        (Tuesday 09:42 ET)
  ✓ Documents current         (README, a11y report, CHANGELOG within 24h)

VERSION BUMP
  v0.9.6-rc → v1.0.0   commit sha 4c1b8e2

LAST-MILE CERT CHECK
  ✓ playtest/regression smoke (12/12)
  ✓ Save fuzz on Linux build (the platform that bit at week 25 in dev)
  ✓ Steam Deck handheld 60fps verified
  ✓ Subtitles default-on, colorblind palettes default-available
```

The Steam Worldwide Launch tools are a different beast from console partner portals. `/publish` will run `steamcmd` on M's behalf — the boundary that `/publish` won't cross is the *console* partner portal. Steam upload is automated:

```
BUILD
  Target: steam
  Outputs:
    Builds/Linux/bramble-1.0.0.zip      (78MB)
    Builds/Windows/bramble-1.0.0.zip    (82MB)
    Builds/macOS/bramble-1.0.0.zip      (84MB)
  
UPLOAD
  Running: steamcmd +login bramble_publish +run_app_build_http \
           ./scripts/steam_app_build.vdf
  → Steam upload complete (8m 32s).
  → Default branch updated.

TAG & PR
  Tag:  v1.0.0 (pushed)
  PR:   #142 — "release: bramble v1.0.0" opened

ROADMAP
  Updated: bramble → Shipped: 2026-11-17.

NEXT
  - Verify storefront flips to "Buy" at 10:00 ET (manual).
  - Enable /post-launch-monitor daily.
  - DO NOT post the launch tweet until the storefront shows the game live.
```

The storefront flips at 10:00:11 ET. M buys their own game from a friend's machine (the Steam store-page screenshot fix from week 29 worked — the small capsule renders correctly in the friend's library). M posts the tweet at 10:01.

### T+1 hour — first `/post-launch-monitor`

```
GAME: bramble
DAYS SINCE LAUNCH: 0 (1 hour)
DATE: 2026-11-17

SIGNALS
  Reviews:            3 (3 positive). GREEN. Sample too small.
  Crash rate (Sentry): 0.1% — GREEN.
  Refund rate:        Steam reports 4% so far (well under 12% threshold).
                      GREEN.
  Player count:       148 concurrent at hour 1. ~620 total purchases.
  Wishlist conversion: 8.2% at hour 1 (industry baseline ~10% for week 1).
                       YELLOW — likely to settle higher as the week
                       progresses; do not act on hour-1 data.

RECOMMENDATION: hold. Re-run end-of-day.
```

M closes the laptop. The 8% wishlist conversion at hour 1 is the kind of number that produces a 3am panic. The skill's "do not act on hour-1 data" line keeps M off Reddit.

## Phase 9: post-launch month 1

### Day 4 — the Linux save-corruption pattern

The day-4 `/post-launch-monitor` digest flags a real pattern:

```
COMMUNITY COMPLAINTS (top 3)
  1. Save file resets to empty after closing the game.
     - 11 mentions, all on Linux. ZERO on Windows or macOS.
     - Bug. Pattern. File regression scenario.
  2. "Could use more biomes."
     - 8 mentions. Design pushback. Backlog for v1.1.
  3. "Cutter card descriptions hard to read on Steam Deck."
     - 5 mentions. Polish gap. v1.0.1 candidate.

CLASSIFICATION: complaint #1 is YELLOW pattern, on track to RED if not
                fixed within 72 hours. Linux is ~8% of the player base
                but its reviews carry weight on a discoverability score.

ACTION
  Hotfix today on the Linux save-write path. Investigate.
```

M runs `/bug-hunt`:

```
/bug-hunt "Linux save resets to empty after closing"
```

The Debugger applies the Iron Law: no fix without investigation. Family: signal leak (per the week-9 studio learning) OR save/serialization. Hypothesis: the atomic save's `OS.move_to_trash()` fallback (used when rename fails on certain Linux filesystems) is wiping the new save before the rename completes. Test: log the save sequence on a Linux dev box. Confirmed:

```
ROOT CAUSE
  scripts/save/save_manager.gd:72
  On Linux ext4 with the journal in writeback mode, the temp+rename
  pattern races: the rename completes before the write is fsync'd.
  On crash, the temp is empty and the rename has already swapped.

  This is the same FAMILY as the GDScript-signal-disconnect-on-tree-exit
  class — both are about lifetime/sequence assumptions that PC-on-dev
  doesn't exercise.

FIX
  Add an explicit FileAccess.flush() and OS.sync() before the rename.
  Two-line change at scripts/save/save_manager.gd:65.

REGRESSION SCENARIO ADDED
  playtest/regression/save-linux-flush-2026-11-21.json
  Runs against a headless Godot Linux build; asserts save survives
  a SIGKILL between write and rename.
```

M fixes the two lines. Adds the regression. Runs the scenario locally. It catches the bug on the un-fixed build, passes on the fixed build. The fix and the regression scenario both ship in v1.0.1 the next morning.

### Day 5 — `/patch-notes` and v1.0.1

```
/publish target=steam version=1.0.1
```

Gates green. Build out. The Steam upload happens automatically. `/patch-notes` writes two artifacts:

```
PLAYER NOTES — marketing/patch-notes/v1.0.1.md

# Bramble — v1.0.1

A fix for save data on Linux, and a small Deck readability tweak.

## Fixed
- **Linux save files no longer reset after closing the game.** Thank
  you to the players who reported this; it was a sync-timing bug on
  certain filesystems and is now patched.
- Cutter card descriptions are larger on Steam Deck handheld.

_The fix is rolling out automatically. Existing Linux saves that
survived the bug are unaffected; lost saves cannot be recovered, but
this issue will not happen again._
```

```
CHANGELOG ENTRY — prepended to CHANGELOG.md

## [v1.0.1] - 2026-11-22

### Fixed
- scripts/save/save_manager.gd — explicit fsync + sync before rename
  on Linux. Prevents save data loss on ext4 writeback-mode journals.
  Regression scenario added.
- UI font scale on Steam Deck handheld bumped 12pt → 14pt for the
  cutter card description (1.5× scale UI test now passes).
```

M posts the player notes to the Steam community hub. The Linux reviewers update their reviews; two of them flip from thumbs-down to thumbs-up explicitly mentioning the speed of the fix. The recent-review percentage rebounds.

### Day 30 — `/post-mortem` and `/learn`

```
/post-mortem launch
```

The Eng Manager pulls the launch month into a blameless retro:

```
LAUNCH POST-MORTEM — Bramble v1.0.0 → v1.0.3

WHAT WORKED
  - Week-3 tech-design save-version field. Saved a v1.1 catastrophe.
  - /code-review-gamestack signal-leak detection caught two bugs that
    would have been "the game feels weird after 30 mins" review fodder.
  - /perf-benchmark weekly cadence caught the particle regression at
    the source.
  - /onboarding-audit pulled time-to-first-cut from 47s to 11s. Refund
    rate landed at 7% (under 12% threshold).
  - /a11y-audit colorblind palettes are mentioned positively in
    ~6% of all reviews.

WHAT DIDN'T (and what to do differently)
  - Linux save bug shipped. The platform-specific edge case wasn't in
    the regression suite. Differently: every cert-class scenario should
    run on at least two platforms in CI, not just the dev's machine.
  - Steam Deck text scaling was caught by a11y-audit at week 30 — too
    late. Should have run a11y-audit at week 20.
  - Trailer first 6 seconds was caught by /steam-page-review at week 29.
    Should have been pinned to a checklist at week 18 (Next Fest start).

GENERALIZABLE LESSONS (piped to /learn)
  1. Run platform-specific regression scenarios on at least two
     platforms in CI from week 13 onward.
  2. Run /a11y-audit at week 20 (mid-production), not week 30 (polish).
  3. Pin the Steam page review to week 18 (Next Fest), not week 29.
```

The three lessons land in `studio/learnings/`. The next game M builds will pick them up at the right phases. The launch itself is closed.

## What gamestack changed

In the week 1–33 arc, eight specific things would have gone differently without gamestack. Some are saves, some are catches, one is a non-help. M is honest about all of them.

**Saves (work gamestack prevented from being wasted):**

1. **Week 2 — the Reduction call.** Without `/plan-creative-director` pushing Reduction mode, M would have built three enemies and a boss in the first 8 weeks, then realized at week 14 that the cutter wasn't a sword. The boss alone is ~3 weeks of work. The reframe-late penalty is another 2. Estimated save: 4–5 weeks.

2. **Week 3 — the save-version field.** Without `/plan-tech-design` forcing `"version": 1` into the schema, M's week-25 schema change wipes player save data on every existing dev build, and then ships the wiping behavior. Estimated save: 1 week of recovery, plus the launch-day catastrophe of a save-wiping patch.

3. **Week 5 — `/find-the-fun` Reform B.** The reframe of thorn-ticks from "enemies that take damage" to "obstacles that fall when their vine is cut" defined the game's identity. Without it, Bramble ships as a Vampire-Survivors-with-a-pickaxe and gets buried.

4. **Week 9 + week 26 — signal-leak catches.** Two bugs `/code-review-gamestack` found pre-playtest that would have shipped as "game feels weird after a while" reviews. Roughly four to six negative reviews avoided on launch.

5. **Week 8 + week 23 — the balance + over-juicing combo.** The Monte Carlo on cutter cards (week 8) found a dominant strategy; the game-feel audit (week 23) found over-juicing on the pickup masking the dominant-strategy taste. Both are findings the average solo dev never gets because they're too in-the-game to see them.

6. **Week 27 — onboarding-audit pulling time-to-first-cut from 47s to 11s.** Direct refund-rate impact. The 7% landed refund rate (vs the ~14% Steam median for the genre) is probably worth a quarter of total revenue.

**Catches (problems gamestack found that M would have missed):**

7. **Week 17 — `/perf-benchmark` catching the particle regression.** Without the weekly cadence, this ships and the Steam Deck reviews flag it. The Deck reviews would have been the single most-cited complaint on launch day.

8. **Day 4 — `/bug-hunt` finding the Linux fsync race.** Without the systematic root-cause-before-fix discipline, M ships a patch that "tries something" and hopes. The race condition would not have been fixed by a guess; the next attempt would have been three days later, by which point Linux reviews are already in their final negative posture.

**Where gamestack did not help (honestly):**

- **The Godot-specific learning curve.** Gamestack's Godot detection is solid, but learning GDScript signal lifecycles is a year of work that no skill compresses. The week-9 leak is M's bug; the skill caught it, but the skill didn't teach M to write the disconnect in the first place.
- **The `.tres` UID drift discipline.** `/plan-tech-design` flagged "don't rename scripts after week 3" but the rule is M's discipline to keep. It does not compose with editor refactors.
- **Music.** Bramble's music is good because M's friend is a good composer. `/plan-audio-direction` would have helped if the audio were M's own work; it had nothing meaningful to add to a competent composer who already knew adaptive music structure.
- **The Next Fest streaming session.** Awkward. No skill can fix that.

The net is: gamestack collapsed the work of about six dedicated specialists into a workflow one developer can operate. It is not magic. It is a checklist that pushes back when you skim it. The pushback is the value.

## Numbers (soft signals — not real revenue claims)

Realistic-feeling shape from the launch month, presented with the cert-walkthrough's tone — not for accuracy, but to anchor what "shipped to a small audience successfully" looks like:

```
LAUNCH WEEK
  Day 1 peak concurrent:           ~340
  Day 1 sales (rough order):       low-thousands
  Day 7 review count:              ~180
  Day 7 review % recent:           ~92% positive
  Day 7 refund rate:               7%   (well under genre median ~12%)
  Day 7 wishlist conversion:       ~14% (industry baseline ~10%)

MONTH 1
  Reviews:                         ~430 (~91% positive maintained)
  Steam Deck Verified status:      Verified (granted day 12)
  Patches shipped:                 3 (v1.0.1 Linux fsync; v1.0.2 Deck
                                       UI polish; v1.0.3 balance pass)
  Net wishlists:                   ~22,000 → 18,500 (conversion expected)
  Reviews mentioning accessibility: ~6%
  Reviews mentioning the cutter
   feel specifically:               ~31%

POST-LAUNCH MONITOR CLASSIFICATIONS
  GREEN days:    21
  YELLOW days:    7  (mostly Linux save week + post-patch normalization)
  RED days:       2  (Linux save peak)
  EMERGENCY:      0
```

The "cutter feels good" mention rate is the load-bearing number. If 31% of reviews call out the verb by name, the game's identity landed. The launch is closed and the v1.1 backlog (the deferred boss, the second meta-progression tier, the third biome) is open in another tab.

## What comes next

- **Month 2.** `/post-launch-monitor` drops to weekly. M shifts work to v1.1 planning. `/design-jam` opens for the v1.1 scope question: "what's the smallest meta-progression that doesn't change Bramble's identity?"
- **Month 3.** v1.1 vertical slice. The deferred boss returns to the table — this time with `/plan-creative-director` to challenge whether it should.
- **Month 6.** Console port decision. Switch lotcheck would re-open every skill in the [cert walkthrough](../howto/howto-cert-walkthrough.md). PS5 / Xbox would require studio resources Bramble doesn't have. M's instinct: Switch first, others if Switch lands.
- **Month 12.** Bramble v1.5 — the planned final content pass — or the next-game pitch, depending on how the audience holds.

## Related

- [`/design-jam`](../../skills/design-jam/SKILL.md) — week 1 pitch pressure-test.
- [`/plan-creative-director`](../../skills/plan-creative-director/SKILL.md) — week 2 Reduction call.
- [`/plan-game-design`](../../skills/plan-game-design/SKILL.md) — week 2 skill curve.
- [`/plan-tech-design`](../../skills/plan-tech-design/SKILL.md) — week 3 save-version field.
- [`/scene-prototype`](../../skills/scene-prototype/SKILL.md) — week 4 Godot scaffolding.
- [`/find-the-fun`](../../skills/find-the-fun/SKILL.md) — week 5 reframe; week 12 boss-cut.
- [`/balance-review`](../../skills/balance-review/SKILL.md) — week 8 + week 23 cutter-card tuning.
- [`/playtest`](../../skills/playtest/SKILL.md) — week 9 onward SDK-driven scenarios.
- [`/code-review-gamestack`](../../skills/code-review-gamestack/SKILL.md) — week 9 + 26 signal-leak catches.
- [`/asset-audit`](../../skills/asset-audit/SKILL.md) + [`gamestack-asset-audit`](../../bin/impl/asset-audit/README.md) — week 13 CI gate.
- [`/perf-benchmark`](../../skills/perf-benchmark/SKILL.md) — week 17 particle regression.
- [`/game-feel-audit`](../../skills/game-feel-audit/SKILL.md) — week 23 over-juicing on pickup.
- [`/onboarding-audit`](../../skills/onboarding-audit/SKILL.md) — week 27 time-to-first-cut.
- [`/steam-page-review`](../../skills/steam-page-review/SKILL.md) — week 29 trailer + capsules + tags.
- [`/a11y-audit`](../../skills/a11y-audit/SKILL.md) — week 30 colorblind palettes + Deck UI scaling.
- [`/cert-readiness`](../../skills/cert-readiness/SKILL.md) — week 32 PC + Deck check.
- [`/publish`](../../skills/publish/SKILL.md) + [`/launch-day`](../../skills/launch-day/SKILL.md) — week 33 launch.
- [`/post-launch-monitor`](../../skills/post-launch-monitor/SKILL.md) — month-1 daily digest.
- [`/bug-hunt`](../../skills/bug-hunt/SKILL.md) — day-4 Linux fsync race.
- [`/patch-notes`](../../skills/patch-notes/SKILL.md) — v1.0.1 player + dev artifacts.
- [`/post-mortem`](../../skills/post-mortem/SKILL.md) + [`/learn`](../../skills/learn/SKILL.md) — month-1 retro and persisted lessons.
- The Godot SDK install + endpoints: [`engines/godot/README.md`](../../engines/godot/README.md).
- The companion cert walkthrough: [`howto-cert-walkthrough.md`](../howto/howto-cert-walkthrough.md).
- The companion launch-day walkthrough: [`howto-launch-day.md`](../howto/howto-launch-day.md).
</content>
</invoke>