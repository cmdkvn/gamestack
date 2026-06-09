<!--
artifact: post-mortem
authored_by: post-mortem
schema_version: 1
when_written: "Weekly during production; within 7 days of every launch."
-->

<!-- Two shapes depending on cadence. /post-mortem picks the correct one based on whether this is
     a weekly retro (every Friday during Production / Polish / Live-Ops) or a launch post-mortem
     (within 7 days of every launch). Both are written to studio/retros/:
     - Weekly: studio/retros/YYYY-WW.md
     - Launch: studio/retros/launch-<game>-YYYY-MM-DD.md
-->

---

## Shape A — Weekly retro

<!-- File: studio/retros/YYYY-WW.md -->

# Weekly retro — YYYY-WW (<Mon date> → <Fri date>)

## Shipped
- <one-liner with PR/commit reference>

## Started but didn't land
- <item> — root cause: <one line>; differently: <one line>

## Planned but didn't start
- <item> — root cause: <one line>; differently: <one line>

## Discovered
- <bug / issue / surprise>

## Surprised by
- <something that was different than expected>

## Wins
- <specific thing that worked>
- <earned skill: <what's easier now>>

## Two things we're doing differently next week
1. <concrete action>
2. <concrete action>

---

## Shape B — Launch post-mortem

<!-- File: studio/retros/launch-<game>-YYYY-MM-DD.md -->

# Launch post-mortem — <Game name> v<X.Y.Z>

Launch date: <date>
Window: cert-pass through +7 days

## What went well
- <specific moment>

## What went poorly
- <specific moment> — root cause: <one line>; differently: <one line>

## Lucky escapes
- <thing that nearly went badly> — root cause: <one line>; differently: <one line>

## Player reception (first 72h)
- Reviews: <count, sentiment summary>
- Crash rate: <pct, source>
- Refund rate: <pct, trend>
- Top complaints: <list>

## Surprises
- <thing the dev didn't anticipate>

## Three things we're doing differently next launch
1. <concrete action>
2. <concrete action>
3. <concrete action>

## Learnings piped to /learn
- <lesson>
- <lesson>
