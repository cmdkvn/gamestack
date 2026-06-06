# How to ship your first gamestack-shaped hour

The promise of gamestack is *discipline at the keyboard.* This walkthrough takes a single one-hour stretch — from "I have an idea" through a working prototype and the first honest critique — and shows what every minute looks like with the right specialists called in at the right moments.

The example game is **Pip's Garden** — a single-screen game about tending a weather-driven garden. Procedural rain, drought, frost. The verb is *protecting*. The fantasy is hand-on-knees, "come on little one, just one more day."

Don't take the example seriously. The point is the *shape* of the hour.

## Minute 0–7: pitch (`/design-jam`)

Open Claude Code. Type:

```
/design-jam I want to build a single-screen weather-garden game.
```

The Creative Director runs you through six forcing questions. Skip the polite "hmm, interesting" — this skill is here to break weak ideas before they cost a weekend.

```
1. Core verb in three words?
   → "Protecting from weather."
2. One-screen pitch?
   → Pip's Garden: a single-screen game where you tend one fragile plant
     across procedural seasons. Cover it, water it, transplant it. Lose it.
3. Target player + what they do instead today?
   → People who play Stardew Valley but never engage with combat. Currently
     playing relaxing genre game X but bouncing off the chores.
4. Kernel of fun?
   → The held breath of an overnight frost forecast.
5. Two X-meets-Y references that overlap?
   → A Mortician's Tale × Wilbur (the cat game). Care + dread + small scope.
6. 8-week cut list?
   → 8 weeks: one plant, one screen, ten weather events. NOT 8 weeks:
     multiplayer, multiple plants, a hub town.
```

Output: `design/pitch.md`. The pitch is now sharp enough for the rest of the pipeline to do something with. The cut list is load-bearing — write it down, or week 4 will reintroduce a hub town.

## Minute 7–15: pressure-test the pitch (`/plan-creative-director`)

```
/plan-creative-director
```

The Creative Director re-reads the pitch in one of four modes. For a tight one-screen idea, the right mode is almost always **Hold Scope** or **Selective Expansion**. The temptation to **Scope-Up** is the bias that kills indie games. Push back if the mode feels like growth for its own sake.

```
MODE: Hold Scope. The core is right.

Risks:
  - "Overnight frost" as the central tension reads exciting on paper.
    Test: can you ship one playable weather event by end of hour?
  - Verb "protecting" is grammatically interesting but mechanically thin.
    What's the action that protects? Cover, water, transplant, prune?
  - You haven't named the failure state. A plant that dies should feel like
    something. What does it look like?

Proposed edits to design/pitch.md:
  - Add "Failure feels like a small private grief" as the second voice line.
  - Add "First playable weather event: overnight frost" as the prototype goal.
```

Accept the edits. Commit. The pitch is now 2 pages and you can defend every line.

## Minute 15–22: lock the mechanics (`/plan-game-design`)

```
/plan-game-design
```

The Lead Game Designer pulls the pitch into the mechanics chain: core loop → skill curve → progression → difficulty → win/loss → replay value.

```
CORE LOOP (30 seconds):
  1. Look at the weather forecast for the next 2 in-game hours.
  2. Decide what to do: cover the plant, water it, prune it, or move it.
  3. Wait through the weather event.
  4. Inspect plant health.

SKILL CURVE:
  Minute 1: see forecast, do the obvious response.
  Hour 1: see forecast, weigh trade-offs (covering loses sun, watering
          encourages root rot, transplanting is stressful).
  Hour 10: predict weather *patterns*, plan ahead.

KILL LIST:
  - "Pruning" — doesn't connect to the weather loop. Remove.
  - "Multiple plants" — re-enters via the kill list. Hold scope.
```

The kill list is exactly what should leave at plan stage so the implementation doesn't have to. Commit. The mechanics plan is 1 page; the skill curve fits in five lines.

## Minute 22–47: prototype skeleton (`/scene-prototype`)

```
/scene-prototype "Pip's Garden — single-screen weather-garden"
```

The Engine Builder detects the engine. Say you're in Unity. The skill produces:

(If you're in Godot, you get GDScript + a `.tscn`. If you're in iOS native, you get a `GardenScene.swift` subclassing `SKScene` + a `GardenApp.swift` @main entry point. The shape is the same; the syntax matches the engine.)

```
GENERATED FILES
  Assets/Scripts/Garden/GardenController.cs   [SerializeField] tunables for
                                              soil moisture, plant health,
                                              cover status. [Header] groups.
  Assets/Scripts/Garden/GardenConfig.cs       ScriptableObject for weather
                                              event tunables.
  Assets/Scripts/Garden/WeatherState.cs       State machine: clear → cloudy →
                                              rain → frost → … back to clear.
  Assets/Scripts/Garden/Plant.cs              Stateful plant: hp, hydration,
                                              cover, age.

SETUP CHECKLIST (garden-setup.md)
  1. New scene: GardenScene.
  2. Create empty: [Garden]. Attach GardenController.
  3. Create child: [Plant]. Attach Plant.
  4. Wire ScriptableObject: GardenConfig.asset.
  5. Press Play. You should see green debug logs.
```

The script compiles clean. Setup is 5 minutes. Inspector wiring is mechanical. Press Play; nothing visual yet, but the state machine ticks in the console.

You spend the next 18 minutes wiring a placeholder sprite, a one-button cover action, and a debug forecast UI. The kit doesn't do this; the kit gets you to minute 25 instead of minute 80, where this work actually starts.

By minute 47 you can press the spacebar to cover the plant and watch a "frost" log entry not damage it. Pip's Garden exists, barely.

## Minute 47–55: drive it (`/playtest`)

```
/playtest
```

The QA Lead checks the gamestack engine SDK probe at `localhost:7331/health`. If you haven't installed the Unity SDK yet, the skill degrades to offline static analysis — perfectly fine at this scope. If you *have* installed the SDK, it spawns a `00-sdk-smoke` scenario to confirm the contract:

```
SCENARIO: 00-sdk-smoke
  ✓ GET /state         OK    scene=GardenScene, fps=60
  ✓ POST /input        OK    1 event accepted
  ✓ POST /screenshot   OK    14 KB
  ✓ POST /snapshot     OK    id=snap-1
  ✓ POST /restore      OK    state matches snap-1
  ✓ POST /breakpoint   OK    add-pause "frost-start" registered
```

Now you walk through the first-minute scenario (`01-prototype-first-minute.json`). It snapshots state, sends spacebar inputs, captures screenshots at known beats.

```
SCENARIO: 01-prototype-first-minute
  ✗ wait_for_state default.gameReady=true   TIMEOUT after 5s
    Hypothesis: there's no gameReady flag yet. Add one.
  → skipping subsequent steps
```

This is a real finding. The scenario is asking the right question — when *is* the game ready? — and the prototype hasn't answered it. Add the flag. Re-run. Pass.

## Minute 55–63: find the fun (`/critique --lens=fun`)

The prototype runs. The state machine ticks. You can cover the plant. But is it *fun?*

```
/critique --lens=fun
```

Don't soft-pedal. The Prototype Critic has four questions and they're not warm-up:

```
1. Name one specific working moment.
   → "When the frost forecast appeared and I dove for the cover button."
   ✓ Specific. Real. The kernel might be here.

2. Name one specific bad moment.
   → "After the frost passed, there was nothing to do for 90 seconds."
   ✓ Real. Tension without compression is boredom.

3. What did a playtester do with their hands and face?
   → I haven't shown anyone yet.
   ⚠ Top priority for next session: get one human in front of this.

4. How long have you lived inside the prototype?
   → 25 minutes.
   ✓ Fresh eyes are credible. Trust them for another week.

KERNEL: present. The "dive for cover" moment is the verb you're shipping.

DEAD MECHANICS:
  - Watering. The plant has hydration but the player never decides to water
    because the forecast doesn't surface drought yet. Either ship drought
    or cut watering.
  - Transplanting. Same — no scenario that punishes leaving the plant where
    it is. Same call.

THREE DIRECTIONS:
  A — Deepen: build 5 weather events instead of 1. The variety carries
      hour 2.
  B — Compress: cut watering and transplanting; ship overnight frost as
      the ENTIRE game; charge $4.
  C — Surround: add the minute *before* and *after* the frost. Anticipation
      and reflection. Music score. The grief.

RECOMMENDED: B for this week, then C next week. A is for week 4 if B+C
hold up under human eyes.
```

You bookmark the critique output to `playtest/critique-fun-2026-06-05.md`. The dead-mechanic kill list joins the cut list from `/design-jam`.

## Minute 63–60-actual: capture what you learned (`/learn`)

```
/learn
```

Two generalizable lessons from the hour:

```
TYPE:   process-learning
WHEN:   2026-06-05; first prototype hour for Pip's Garden
LESSON: A prototype with no scenario for the verb you're shipping is
        not testable. The verb (cover) needed a forecast UI before
        /critique --lens=fun could produce a real "working moment."

TYPE:   workflow-shortcut
WHEN:   2026-06-05; /playtest scenario 01 timeout
LESSON: When scenario 01 times out on default.gameReady, the prototype is
        missing a ready-flag. Adding [GameStackState("gameReady")] takes
        five lines and is always worth the time.
```

These land in `studio/learnings/`. Next time you start a prototype, the second lesson surfaces in the first three minutes.

## What just happened

In one hour you went from "I have an idea" to:

- A pressure-tested pitch with a cut list (`design/pitch.md`).
- A pressure-tested mechanics plan with a kill list (`design/game-design.md`).
- Compiled engine scaffolding (`Assets/Scripts/Garden/`).
- A playable verb (spacebar to cover).
- A first SDK-driven playtest run with one actionable finding.
- An honest critique that says "the kernel is here; cut two mechanics; sharpen the minute around the verb."
- Two studio learnings persisted for the next prototype.

Without gamestack, the same hour usually produces an empty scene, a half-written design doc, and the feeling of being stuck. The skills don't write the game — they enforce the questions that, in retrospect, you wish you'd asked.

## What comes next

- **Tomorrow.** Get one human in front of the prototype. The Prototype Critic flagged it; the only thing that produces real signal is a face.
- **Next week.** Direction B (compress to overnight frost only). Run `/critique --lens=fun` again at the end of the week.
- **Hour 8.** [`/plan-art-direction`](../skills/plan-art-direction/SKILL.md) once you know the game holds up. Don't lock art before the verb does.
- **Hour 12.** [`/critique --lens=feel`](../skills/critique/SKILL.md) once the verb is stable. Polish only on top of a working loop.

## Related

- [`/design-jam`](../skills/design-jam/SKILL.md) — the entry skill walked through here.
- [`/plan-creative-director`](../skills/plan-creative-director/SKILL.md) — pitch pressure test.
- [`/plan-game-design`](../skills/plan-game-design/SKILL.md) — mechanics chain.
- [`/scene-prototype`](../skills/scene-prototype/SKILL.md) — engine scaffolding.
- [`/playtest`](../skills/playtest/SKILL.md) — SDK-driven runs.
- [`/critique --lens=fun`](../skills/critique/SKILL.md) — the honest critique.
- [`/learn`](../skills/learn/SKILL.md) — persistence across sessions.
- The next tutorial: [howto-art-pipeline](howto-art-pipeline.md) once the verb is stable.
