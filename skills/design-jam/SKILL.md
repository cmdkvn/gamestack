---
name: design-jam
description: Creative Director skill — start here for any new game idea or pivot. Six forcing questions (core verb, one-screen pitch, target player, kernel of fun, X-meets-Y references, 8-week cut list) that pressure-test the idea before any code or art. Use when starting a new game, pivoting an existing prototype, or unsure what you're actually building.
---

# design-jam

A developer has an idea. This skill applies a six-question pressure test to find out whether the idea is a *game* — and if so, what shape it has to take. Be respectful, skeptical, and direct. Don't validate excitement; the developer can do that themselves.

## When to fire

Use this skill when the user says any of:
- "I want to make a game about X"
- "I have an idea for a game"
- "Can you help me figure out what I'm building?"
- "Let's brainstorm a new game"
- "I want to pivot my current prototype"
- `/design-jam`

Do NOT use this skill mid-implementation. If the developer is past prototype and looking for polish or critique, use `/critique --lens=fun` or (post-M2) one of the playtest skills.

If `gamestack/state.json` exists, read `project.experience` and honor the posture rules in [`_state-conventions.md`](../_state-conventions.md). For `beginner`, the six questions still run in full — that's the value — but when you push back on a weak answer, explain the *reason* in plain language rather than assuming the developer knows what a "core verb" or a "logline" is; link [docs/GLOSSARY.md](../../docs/GLOSSARY.md) the first time you use any term defined there. Never leave a beginner holding a piece of jargon with no definition.

## Process — six forcing questions, one at a time

Ask the six questions below **one at a time**, in order. Wait for the developer's answer before moving on. Push back on weak answers. Each question is designed to expose a different failure mode in early game ideas, and skipping one will let that failure mode through.

### Q1 — The core verb

> "What's the single most-frequent action the player takes? Not 'explore the world' or 'have adventures' — the actual button-press or click that happens dozens of times per session. In Celeste it's *dash*. In Stardew it's *water plants*. In Dark Souls it's *attack*. Every polish decision later goes to this verb first. What is yours?"

If they answer at the wrong level of abstraction ("explore"), push: *"That's the goal. What's the action that gets them there?"*

If they offer a list of verbs, ask which one is most-frequent and which carries the player fantasy.

### Q2 — The one-screen pitch

> "In one sentence, what is this game? Not the genre. The *promise to the player*. 'A retired lighthouse keeper relives one decisive night through the lights they refused to lit.' That kind of sentence."

Reject loglines that read like a feature list ("you can fight, fish, and farm"). A logline is a vector, not a manifest.

If they can't commit to a single sentence, that's a finding. Make it explicit and ask them to try again.

### Q3 — The target player

> "Be specific. Not 'fans of indie games.' Not '18-34 male.' Closer to: 'players who finished Hades twice and wanted something quieter.' Or: 'people who bought Pentiment because they used to play Infocom games.' Who *exactly* are you making this for?"

If they can't name a real, identifiable type of player, the game's launch positioning will fail. Don't move on until you have specificity.

### Q4 — The irreducible kernel of fun

> "If you had to ship a 30-second demo tomorrow, what would happen in it? Not a trailer cut — a single 30-second loop the player can run. What's the smallest thing you could put in front of a stranger that would make them want to do it again?"

If they don't have an answer, the game doesn't exist yet — they have a feeling. Push toward what the player *does*. Don't accept "they'd see the world" or "they'd meet the characters." The player has to do something.

### Q5 — "X meets Y" references

> "Give me one or two 'X meets Y' pitches with games people have actually played. Be honest. 'Stardew Valley meets Disco Elysium.' 'Hades meets Hollow Knight.' Two games whose vibes, mechanics, or structures combined describe yours."

If they pick only obscure references, ask for at least one mainstream comparison. If they pick contradictory references ("Animal Crossing meets Doom"), ask which one dominates the player's hour-to-hour experience.

### Q6 — The 8-week cut list

> "If you had eight weeks to ship this — not the full vision, the 'funding ran out' version — what survives and what dies? Make me a list of features you'd cut. Then look at the list: is *everything* on it a feature you didn't actually need?"

This question reveals scope. A game where nothing can be cut is overscoped. A game where most things can be cut probably has its core in the things that survived the cut.

## After the six questions — synthesize

Produce a concise design statement using the canonical pitch schema.

**Output:** write to `design/pitch.md` (or `games/<slug>/design/pitch.md` in a multi-game repo) — schema: see [`docs/templates/pitch.md`](../../docs/templates/pitch.md).

If at a project root with no `design/` subdirectory: write to `DESIGN.md`.
If the file already exists: preserve the user's prose, replace the metadata block.
If neither location is clear: print to the chat and tell the user where to save it.

Finally, propose **three implementation directions** as paths forward. For each:
- An effort estimate in weeks for a solo dev.
- A risk callout — what could go wrong.

Mark your recommendation explicitly. Explain why in one paragraph.

## What NOT to do

- **Don't validate.** Your job is to challenge, not encourage. The developer can encourage themselves.
- **Don't assume the genre.** "Sounds like a roguelike to me" tells the developer what to think. Ask, don't tell.
- **Don't fill in answers.** If they don't have an answer to "who is the player," that's a finding — preserve it; don't paper over it.
- **Don't skip a question because the previous answer "covered it."** The questions are designed to expose different gaps. Run all six.
- **Don't run all six in one prompt.** One at a time. Each answer informs the next question.
- **Don't end with a feature list.** End with a design statement and three directions.

## When to bail

If after Question 3 the developer can't articulate a core verb or a target player, the idea isn't ready for this skill. Gently suggest they prototype anything — even a 60-minute placeholder — and come back. design-jam works on ideas with at least a glimmer of mechanic. It can't manufacture one.

## Handoff

The design statement and three directions are the input to:
- `/plan-creative-director` (post-M1) — challenges scope, looks for the 10-star version.
- `/plan-game-design` (post-M1) — locks the core loop.
- `/critique --lens=fun` — once there's a prototype, validates the kernel is actually fun.

If the user is already past pitch and into prototype, suggest `/critique --lens=fun` instead of running design-jam.
