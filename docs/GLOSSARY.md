# Glossary

Plain-language definitions of the game-dev jargon gamestack skills use. When `project.experience` is `beginner`, skills link here instead of re-explaining every term inline. Written for someone who has never made a game; alphabetical.

## Asset

Any file the game loads that isn't code: images, sounds, music, fonts, 3D models. "Sourcing assets" means finding or making those files. [`/source-assets`](../skills/source-assets/SKILL.md) is the skill that does it legally.

## Attribution

Crediting the person who made an asset you used. Some licenses require visible credit — in practice, a credits screen in the game. gamestack records every asset's source and license in `assets/ATTRIBUTION.md` so you always know exactly what credit you owe, months later when nobody remembers.

## Blockout (greybox)

A rough draft of a level built from plain gray boxes instead of real art. The point is to test size, flow, and pacing while changes are still cheap — if the level isn't fun as gray boxes, art won't save it.

## Capsule

The rectangular cover image for your game on Steam's store. It's the first (often only) thing a shopper sees, which makes it the single highest-leverage piece of marketing art you'll make.

## Cert (TRC / TCR / lotcheck)

Short for certification: the mandatory test pass console makers run before your game may ship on their platform. Each company names its checklist differently — TRC (PlayStation), TCR (Xbox), lotcheck (Nintendo). A failed submission costs weeks, which is why gamestack has a whole skill ([`/cert-readiness`](../skills/cert-readiness/SKILL.md)) for it.

## Core loop

The cycle of actions a player repeats for the whole game: do a thing → get a result → want to do the thing again. A farming game's loop might be plant → wait → harvest → buy seeds. If the loop isn't satisfying, more content just means more of the unsatisfying loop.

## Core verb

The one action the player performs most — "jump", "plant", "parry". Almost everything else in a game exists to give the core verb context. If the verb itself isn't fun, the game isn't.

## Creative Commons licenses (CC0, CC-BY, CC-BY-SA, CC-BY-NC)

The standard licenses on free assets, and they are not interchangeable. **CC0**: no strings attached, use freely — the safe default. **CC-BY**: free, but you must show visible credit. **CC-BY-SA**: anything you adapt must carry the same license — legally murky for games, skip it. **CC-BY-NC**: non-commercial only — a game you sell, or even give away with a tip jar, doesn't qualify, skip it.

## Delta time

The time elapsed since the previous frame. Multiply movement and timers by it so the game runs at the same speed on a fast machine and a slow one — otherwise players with better hardware literally play a faster game.

## Draw call

One instruction from the game to the graphics card: "draw this." Each call has fixed overhead, so a frame with thousands of them slows down even when each thing drawn is simple. Reducing draw calls (by batching things together) is a standard performance fix.

## Experience level

The `project.experience` dial in `gamestack/state.json`: `beginner`, `intermediate`, or `expert`. It controls how every skill communicates with the developer. **beginner** — skills explain changes in plain language, apply fixes automatically with narrated editor steps, and link here for jargon instead of assuming familiarity. **intermediate** — jargon is defined once; the developer can read a diff. **expert** — pre-axis behavior, unchanged. Set at bootstrap; change later with `/gamestack experience=<level>`.

## Frame budget

The time the game has to compute each frame: 16.7 milliseconds at 60 frames per second. Everything — physics, AI, drawing, audio — shares that budget. Exceed it and the frame is late, which the player perceives as stutter.

## Game feel (juice)

The moment-to-moment physical satisfaction of controlling the game — how responsive, weighty, and alive the core verb feels. Built from small touches: hit-pause, screen-shake, particles, sound, animation curves. Two games with identical mechanics can feel completely different; "juice" is the informal word for those touches.

## GC allocation

GC is the garbage collector — the system that automatically reclaims memory a program no longer uses. An "allocation" is a request for new memory. Allocating every frame forces the collector to run mid-game, and its pauses show up as stutter. This is why review skills flag allocation inside per-frame code.

## Hit-pause

Freezing the action for a few hundredths of a second at the moment an attack connects. It sounds like a bug; it's the opposite — that tiny stop is what makes hits feel like they *land*. One of the cheapest game-feel wins there is.

## Kernel of fun

The smallest piece of your game that is already enjoyable on its own — one verb, one consequence, maybe ten seconds long. gamestack's design skills hunt for it relentlessly, because a game built outward from a real kernel works, and a game built without one is content wrapped around a hole.

## Loopback (127.0.0.1)

The network address that means "this same computer." A server bound to 127.0.0.1 can only be reached by programs running on your machine — nothing on your WiFi or the internet can touch it. gamestack's engine SDKs bind to loopback for exactly that reason.

## Onboarding

The player's first minutes: learning the controls, the goal, and why to care — without a manual. Measured in concrete moments: time to first verb, first decision, first reward, first failure, first "I get it". Most players who quit a game quit here.

## Pacing / tension graph

Pacing is how a game alternates intensity and rest over time. A tension graph plots that intensity across the levels or story beats — spikes, valleys, and (the thing to catch) long flat stretches where nothing changes. Flatlines are where players quietly stop playing.

## Phase

gamestack tracks every project through seven phases, stored in `gamestack/state.json` as `project.phase`:

- **pitch** — deciding what the game is; no build yet.
- **prototype** — first working build, finding the fun.
- **vertical-slice** — one polished slice of the game finished to shipping quality.
- **production** — most of the content being built.
- **polish** — content locked, focus on feel, pacing, and accessibility.
- **cert** — submitting to PS5 / Xbox / Switch / App Store.
- **launched** — live to players.

The developer advances the phase explicitly via `/gamestack`; skills never silently change it. See also: **Pipeline**.

## Pipeline

The skill-pipeline names — Pitch, Plan, Build, Review, Playtest, Ship, Reflect — describe the *workflow arc* that gamestack skills follow, not the production phases stored in `state.json`. The arc is a menu, not a conveyor belt; most projects loop through Build → Review → Playtest many times before reaching Ship. See **Phase** for the seven values actually stored in `state.json`.

## Placeholder (programmer art)

A stand-in asset — a colored rectangle for the hero, a beep for the sword — used so the mechanic can be built and tested before real art exists. Deliberately ugly is fine; the point is to make the game playable now and swap in real assets later ([`/build-feature`](../skills/build-feature/SKILL.md) emits a list of every placeholder it leaves, and [`/source-assets`](../skills/source-assets/SKILL.md) replaces them).

## Playtest

Running the actual game to see what actually happens — as opposed to reading the code and predicting. The single most informative activity in game development, and the most commonly skipped. In gamestack, [`/playtest`](../skills/playtest/SKILL.md) can drive the build itself through the engine SDK.

## Review mode

gamestack's intensity dial for review-type skills, stored as `project.review_mode`: **lean** (blockers only), **normal** (the full rubric), or **intense** (full rubric plus an adversarial double-check). Details in [`STATE.md`](STATE.md).

## Screen-shake

Briefly jolting the camera when something forceful happens — an explosion, a heavy landing. Used sparingly it sells impact; overused it reads as noise and can make players motion-sick. A core game-feel tool with a sharp overdose curve.

## SDK

In gamestack, "the SDK" means the engine SDK specifically: a small server you add to your running game so gamestack can read its state, send it input, take screenshots, and save/restore moments — all from outside the game. One per engine (Unity, Godot, iOS, web), same contract. Full reference: [`ENGINES.md`](ENGINES.md).

## Sprite

A 2D image the game draws on screen — a character, a coin, a tile of grass. Most 2D games are sprites all the way down. Sprites are usually packed together into sheets (atlases) so the graphics card can draw many of them cheaply.

## Vertical slice

One short piece of the game finished to shipping quality — final art, final sound, final feel — rather than the whole game at draft quality. It proves the team can hit the bar, and it's what publishers and festivals ask to see.

## Wishlist / Next Fest

Steam machinery that decides whether anyone sees your game. A wishlist is a player clicking "remind me when this launches" — the count is the main input to Steam's launch-visibility algorithm. Next Fest is Steam's recurring demo festival, and the single biggest wishlist-generating event available to an unreleased indie game.
