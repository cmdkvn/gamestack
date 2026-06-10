---
name: source-assets
description: Asset Wrangler skill — finds, licenses, and imports art, audio, and fonts so placeholder assets become real ones without an artist on staff. Walks free CC0/CC-BY libraries (Kenney, OpenGameArt, Quaternius, freesound, Google Fonts), structures AI generation through /art-shotgun for bespoke pieces, and enforces license hygiene via assets/ATTRIBUTION.md. Use when the build is full of colored rectangles and silence — typically mid-prototype onward — or before shipping anything containing assets you didn't make.
---

# source-assets

The art pipeline plans beautifully — [`/plan-art-direction`](../plan-art-direction/SKILL.md) locks a style, [`/art-bible`](../art-bible/SKILL.md) specs the assets — and then nothing on disk gets any prettier, because the solo dev can't draw and there's no artist on staff. The default path from there is the dangerous one: grab something that looked free, ship it, find out later what "free for personal use" meant. This skill walks the legal path instead. It inventories what the build actually needs, sources each asset from a library whose license is known, imports it correctly for the engine, and records every file in `assets/ATTRIBUTION.md`. License hygiene is the spine of this skill; pretty is second. An ugly game ships — a game built on assets you can't legally distribute doesn't.

## When to fire

Use when the build needs real assets and nobody on the team makes them. Trigger phrases:
- "Get me real art"
- "Replace the placeholders"
- "Find sound effects"
- "I need a font / music / a tileset"
- `/source-assets [category]` — optional category: `art | audio | music | font | 3d`

Prerequisites:
- `gamestack/state.json` must exist. If it doesn't, redirect per [`_state-conventions.md`](../_state-conventions.md).
- No planning docs required. `design/art-direction.md` and friends sharpen the search when present; their absence never blocks a placeholder swap.

When a recent [`/build-feature`](../build-feature/SKILL.md) run left a PLACEHOLDERS list in its output, start from that list — it's the needed-asset inventory, already named and scoped. That list is same-session output, not a file; in a fresh session, fall back to the build scan (Step 2).

## Process

### Step 1 — read state + direction

Read `gamestack/state.json` per [`_state-conventions.md`](../_state-conventions.md): `engine`, `phase`, `experience`, `platforms`. Honor the experience posture for everything that follows. Then read the direction docs if they exist:

- `design/art-direction.md` — the style statement; what "fits" means here.
- `design/art-bible.md` — palette hex codes, silhouette rules, asset naming taxonomy. Filter candidates against these.
- `design/audio-direction.md` — SFX taxonomy, music structure, mix priorities.

If they're absent — common at prototype — proceed with sensible defaults and say so in one line. A consistent pack family (Step 3) is a good-enough style anchor until the direction is written.

### Step 2 — inventory what's needed

Build the needed-asset list before browsing anything — browsing first produces "ooh" imports; the inventory keeps the run scoped. Sources, in order of reliability:

1. PLACEHOLDERS lists from recent [`/build-feature`](../build-feature/SKILL.md) runs — already named per feature. Same-session output only; in a fresh session, skip to 2.
2. The build itself: colored-rect sprites and primitive meshes, code-generated beeps, audio calls with no file behind them (`play_sound("jump")` and no jump sound), default engine fonts in UI scenes.
3. The developer's ask, if they invoked with a category.

Emit each need with a category — `sprite | tileset | SFX | music | font | 3D` — and the spec that matters for sourcing: grid size for tiles, loop vs one-shot for audio, display vs body for fonts, animation frames needed for characters.

### Step 3 — source, in order

Cheapest-legal first. Work down the tiers; stop at the first that covers each need.

**(a) Free packs** — the bulk answer. Known-good libraries by category:

| Category | Source | License | Notes |
|---|---|---|---|
| Art (2D) | Kenney — kenney.nl | CC0 | The default answer. Huge, internally consistent, zero strings. Start here. |
| Art (2D) | OpenGameArt | varies per asset | Check every asset's license line individually — the site hosts everything from CC0 to GPL. |
| Art (2D) | itch.io free packs | varies per page | Read each pack page's license text. "Free" on itch means free to download, not necessarily free to ship. |
| 3D | Quaternius — quaternius.com | CC0 | Consistent low-poly style; packs combine cleanly. |
| SFX | Kenney audio packs | CC0 | Same deal as the art. |
| SFX | freesound.org | varies per file | Has a CC0 search filter — use it. Off the filter, every file needs an individual license check. |
| SFX | OpenGameArt audio | varies per asset | Same per-asset check as the art side. |
| Music | Kevin MacLeod — incompetech.com | CC-BY | Attribution required: visible credit, in the exact format the site specifies. |
| Music | FreePD | CC0 | Public-domain music, no credit owed. |
| Fonts | Google Fonts | OFL / Apache 2.0 | Both game-safe, embedding included; copy the per-font license line from the specimen page into the ledger. Skip "free font" aggregator sites — license provenance there is unverifiable. |

Prefer one pack family over many sources: ten Kenney sprites look like one game; ten sprites from ten packs look like a ransom note. Filter candidates against the art bible's palette and the direction's style statement when those exist.

**Web access note.** This skill may run with or without live web access. Either way, name concrete candidates from the table first. With access: open the asset's actual page and verify the license stated there *before* any download — verifying is the agent's job; the actual download and unzip is the developer's unless the agent can write files, and either way every URL gets named in the output first. Without: give the developer the URL and exactly what to verify — "the License line on the pack page must say CC0; if it says anything else, come back before importing" — and treat the asset as unsourced until they confirm; these go in the output's PENDING VERIFICATION block.

**(b) AI generation, via [`/art-shotgun`](../art-shotgun/SKILL.md)** — for hero and bespoke pieces no pack covers: key art, a specific character, a capsule. Route there rather than ad-hoc prompting; it anchors generation to the art bible and captures taste across rounds. Mark every AI output as AI-generated in the ledger (Step 4) — Steam requires AI-content disclosure at submission, and that checkbox is unanswerable months later without the marks.

**(c) Commission** — when there's budget and the asset carries the game's identity. Realistic per-asset indie rates: a single sprite or icon $10–50; an animated character $50–300; a tileset $100–500; music $100–400 per finished looped minute; SFX $5–30 each, cheaper batched. Where to look: itch.io artist pages and r/gameDevClassifieds. Get the license in writing — work-for-hire or a perpetual commercial license — and ledger the commission like any other asset.

### Step 4 — license ledger (non-negotiable)

Every imported asset gets a row in `assets/ATTRIBUTION.md` before the run ends. No exception for "obviously fine" CC0 packs — the ledger's value is completeness; one undocumented file makes every file suspect. Create the file on first import:

```markdown
# Asset attribution

One row per imported asset or asset group. Never delete rows; mark removed assets as removed.

| File(s) | Source URL | Author | License | Fetched | Notes |
|---|---|---|---|---|---|
| assets/sprites/player/* | https://kenney.nl/assets/platformer-pack | Kenney | CC0 | 2026-06-10 | 14 files from a 380-file pack |
| assets/music/theme.ogg | https://incompetech.com/... | Kevin MacLeod | CC-BY 4.0 | 2026-06-10 | credit owed on credits screen — not built yet |
| assets/art/capsule.png | (AI-generated) | /art-shotgun + <tool> | AI-generated — storefront disclosure required | 2026-06-10 | final prompt in taste log |
```

License traps, stated as rules:

- **CC0** — no strings, no credit owed. The default answer for a reason.
- **CC-BY requires visible credit.** A credits screen counts; a row in ATTRIBUTION.md alone does not. No credits screen yet? Note the debt in the ledger's Notes column so it can't be forgotten.
- **CC-BY-NC / anything-NC — no commercial use**, and a free game with ads, a tip jar, or a paid storefront page is still commercial. Skip. freesound and OpenGameArt are full of NC assets — check every file.
- **CC-BY-SA permits commercial use — the trap is ShareAlike.** Adaptations must carry the same license, and whether a recolored sprite counts as an adaptation is legally murky. For a solo dev the safe rule is still: skip SA assets.
- **"Free for personal use" means NOT free for a shipped game.** A $0 game on itch.io is still distribution. Skip the asset.
- **"Royalty free" is not a license.** It describes a payment model. Find the actual license text; if it can't be found, the asset is unlicensed and stays out.
- **Never rip assets from other games** — or take them from the sprite-sheet sites that host extracted rips. Those files are copyrighted; the hosting site doesn't launder them, and "everyone prototypes with them" ends in a takedown against your launch build.

### Step 5 — import, per engine

Place files per the art bible's naming taxonomy when one exists; otherwise `{category}_{subject}_{variant}_{state}.{ext}` (the [`/asset-audit`](../asset-audit/SKILL.md) default — omit `state` where it's meaningless: `sfx_jump_01` vs `spr_player_idle_01`).

- **Unity** — files under `Assets/` in the taxonomy folders, and the ledger lives at `Assets/ATTRIBUTION.md` there. Pixel art: Filter Mode = Point, Compression = None, Pixels Per Unit matched to the source grid. Pack UI and sprite sets into a Sprite Atlas. Audio: Force To Mono for SFX, Vorbis for music and ambience, PCM only for short transients.
- **Godot** — copy into project-root `assets/` in taxonomy subfolders (the ledger example paths above); the import dock regenerates `.import` files when the editor regains focus. Pixel art: default texture filter Nearest (project-wide or per-asset in the Import dock, then Reimport). Commit the `.import` files; never commit `.godot/`.
- **Web** — files land in project-root `assets/` in taxonomy subfolders, matching the ledger example paths. Register every file in the preload manifest (Phaser `preload()`, or whatever loader the framework uses); pack sprites into sheets before shipping; ship audio as ogg+m4a pairs — no single codec covers all browsers.
- **iOS** — images go through the asset catalog (`.xcassets`) with 1x/2x/3x variants or a single vector; audio ships as AAC/CAF in the bundle. No loose image files outside the catalog.

Re-encode MP3 music to OGG before looping — MP3 encoder padding breaks seamless loops. incompetech serves MP3; budget the re-encode.

### Step 6 — state write-back

Per [`_state-conventions.md`](../_state-conventions.md): append a `recent_runs` entry (`outcome: "ok"`; `"bailed"` if the run ended on a redirect — no state.json, or nothing needed sourcing). This skill owns no `artifacts.*` key; ATTRIBUTION.md lives with the assets, not the state file. Never touch `phase`.

## Experience posture

General rules live in [`_state-conventions.md`](../_state-conventions.md). Deltas specific to this skill:

- **beginner** — pick for them: Kenney first, one candidate per needed asset, not a menu. Narrate download and import click-by-click — where the download button is, where the zip lands, which project folder each file goes into, which import setting to click. Write ATTRIBUTION.md automatically and explain in one sentence why it exists.
- **expert** — present a candidate table per category with the tradeoffs (style fit, license, pack size, coverage); they choose. Don't download anything before the choice.

## Output format

```
NEEDED (<n> assets)
  sprites: <n>  tilesets: <n>  SFX: <n>  music: <n>  fonts: <n>  3D: <n>

SOURCED
  <needed asset> → <file/pack, source> → <license>
  ...

PENDING VERIFICATION (no-web runs)
  <asset> → <candidate URL> → <what the license line must say>
  ...

ATTRIBUTION.md: <created | updated> — <n> rows added (<n> marked AI-generated)

IMPORT STEPS
  1. <engine-specific step>
  ...

STILL MISSING
  - <asset>: <why no pack covers it> → /art-shotgun | commission (~$<range>)

NEXT
  <recommended next skill>
```

## What NOT to do

- **Never import an asset whose license you couldn't determine.** "Couldn't find it" means no, not "probably fine." The asset stays out until the license is read.
- **Don't bulk-import a 2,000-file pack for 10 sprites.** Import the files the inventory needs; the pack URL in the ledger keeps the rest one download away. [`/asset-audit`](../asset-audit/SKILL.md) will flag the bloat otherwise.
- **Don't mix AI-generated and licensed assets in the ledger without marking which is which.** Storefront disclosure depends on knowing which files are which, months from now, when nobody remembers.
- **Don't restyle the art direction.** A great asset in the wrong style is the wrong asset — flag the mismatch against `design/art-direction.md` and offer alternatives. Don't silently accept it, and don't silently rewrite the direction to fit the find.
- **Don't fetch anything without telling the developer what URL you're reading.** Every page opened and every file downloaded gets named in the output, before the import happens.

## Handoff

After `/source-assets`:
- [`/asset-audit`](../asset-audit/SKILL.md) — the new imports now count against per-platform budgets and the naming convention; audit before the next milestone gate.
- [`/art-shotgun`](../art-shotgun/SKILL.md) — for the STILL MISSING pieces no pack covers.
- [`/critique --lens=feel`](../critique/SKILL.md) — real assets change how the game feels; re-run the feel audit once they land.
- [`/build-feature`](../build-feature/SKILL.md) — the producer of the PLACEHOLDERS lists this skill consumes; the next feature emits the next list.
