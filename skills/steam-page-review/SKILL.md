---
name: steam-page-review
description: Marketing Lead skill — game-dev-unique. Audits a Steam store page across capsule artwork specs, trailer pacing (first 6 seconds), short-description hook, tag strategy, screenshot quality, and Next Fest fit. Compares against current top-sellers in the game's primary genre tag. Produces specific edits and a wishlist-conversion impact estimate. Use 60-90 days before launch and again before every major update.
---

# steam-page-review

This skill walks the Steam page artifacts (capsule artwork, trailer, short description, screenshots, tags), identifies the wishlist-killing weak spots, and proposes specific edits. The failure mode it scans for: indie games with strong gameplay launching quietly because their Steam page was an afterthought.

## When to fire

Use 60-90 days before launch (when the coming-soon page goes live), and again before every major update or Next Fest entry. Trigger phrases:
- "Review the Steam page"
- "Audit Steam capsules"
- "Steam page review"
- "Is my Steam page good?"
- `/steam-page-review`

If the game is too early to have a Steam page, redirect to `/design-jam` or `/art-bible` (for the pitch + capsule key art).

## The lens — what Steam shoppers actually see

A Steam shopper's decision lattice:
1. **Browse view** — capsule + short tag list. They click or don't. Capsule is everything here.
2. **Store page** — first 6 seconds of trailer auto-plays. They watch or close the tab.
3. **Above the fold** — short description (~300 chars), screenshots, system requirements. They wishlist or scroll.
4. **Below the fold** — long description, reviews, similar games. They read if they're still interested.

Each layer's purpose is to get them to the next. Audit accordingly.

### Steam capsule sizes (current)

| Slot | Size | Where it shows |
|---|---|---|
| Header capsule | 460×215 | Featured banner, search results, library |
| Small capsule | 231×87 | Search results, similar games |
| Main capsule | 1232×706 | Top of the store page |
| Library capsule | 600×900 | User library (vertical) |
| Library hero | 3840×1240 | Library banner |
| Library logo | 1280×720 (transparent) | Overlaid on hero |
| Page background | 1438×810 | Behind the page |

Validate every slot is filled with on-spec dimensions.

## Process

### Step 1 — locate the Steam page assets

Find:
- Capsule art files (typically `marketing/steam/` or `games/<name>/marketing/`).
- Trailer files / YouTube URL.
- Screenshots used on the page.
- Page text — short description, long description, tags, system requirements.
- Steam app ID and current page state (coming soon / live / hidden).

If none of these exist as files, ask the developer to point at them or paste/link them.

### Step 2 — capsule audit

For each capsule slot:

| Check | Pass criterion |
|---|---|
| Size | Matches Steam spec exactly |
| Format | PNG or JPG; no transparency unless slot allows it (Library logo) |
| Legibility | Title readable at 50% scale on a 1080p monitor |
| Subject | Player can identify the game type from the silhouette alone |
| Brand | Studio logo present in the Library hero |
| Localization | Versions for major languages OR text-light enough to skip localization |

Common failures:
- **Title too small** — the most-common indie capsule mistake. Title needs to read at thumbnail size.
- **Generic genre art** — moodboard art that could belong to any pixel-art platformer.
- **Subject too small in the main capsule** — main capsule has space; use it.
- **No Library hero / logo** — Steam's library is where players spend a lot of time; without these the game looks unfinished even after launch.

### Step 3 — trailer audit

**First 6 seconds critical.** This is what auto-plays in the storefront. Apply:

- **Verb in the first 3 seconds.** The player should see the primary gameplay action immediately, not a logo card.
- **No "studio name" card at the start.** Move it to the end.
- **No black fade-in.** Players think the video is broken.
- **Title shown by 6 seconds** but not as the only content (overlay on gameplay).
- **Logos / disclaimers at the end**, not at the start.

Beyond the first 6 seconds:
- **60-90 seconds total** is the sweet spot. 120 seconds is the upper limit; nobody watches past that.
- **Mix of gameplay clips and "wow" moments.** Heavy story / cinematic-only trailers underperform for indie games.
- **Subtitles / captions ON by default** if there's voice or important audio.
- **No reused footage** between the first and last 10 seconds. Players notice.

### Step 4 — short description audit

Steam allows up to 300 characters for the short description. Check:

- **First sentence is a HOOK** — describes the game so a player who hasn't seen the capsule still understands.
- **Avoid clichés** — "epic adventure," "embark on a journey," "discover a vast world." These are tax characters; cut them.
- **Avoid feature lists** — "✓ 100+ levels ✓ unique gameplay ✓ stunning visuals" reads as desperate.
- **One concrete promise** beats many vague ones.
- **Genre named explicitly** — Steam search ranks pages where the genre word appears in the description.

### Step 5 — tag strategy

Steam tags drive discovery. Audit:

- **5-15 tags total.** Too few = under-tagged for search; too many = tag pollution.
- **3-5 tags should be GENRE-LEADING tags** for the game's primary genre. Look at the top sellers in that genre and tag in the same way.
- **2-3 tags should be SUB-GENRE / VIBE tags** — "Atmospheric," "Story Rich," "Difficult," etc.
- **Avoid stretch tags** — tagging "VR" on a non-VR game gets the page suppressed by Steam if reported.
- **Tag order matters in the dashboard but NOT in search.** Order the most-strategic tags first for human readability.

Cross-reference: look at the tags of 5 successful games in the same micro-genre. Where the developer's tag set diverges, ask if it's intentional.

### Step 6 — screenshot audit

Steam shows 5-12 screenshots prominently. Apply:

- **First screenshot is hero art.** It carries the visual weight of the capsule below it.
- **No UI heavy** — screenshots with HUD all over the screen don't convert.
- **Variety, not redundancy** — 5 versions of "exploring a forest" sells nothing.
- **Include a wide range of contexts** — open exploration, intense moment, character close-up, environmental beauty.
- **Vertical-friendly framing** — when Steam crops to mobile, important subjects shouldn't be at the edges.

### Step 7 — Next Fest fit (if applicable)

If the developer is planning a Steam Next Fest entry:
- **Demo length:** 15-30 minutes is the conversion sweet spot; 60+ minutes underperforms.
- **Demo end-on-a-hook:** the cliffhanger drives "add to wishlist."
- **Trailer specifically tuned for Next Fest:** shorter (30 seconds), demo-focused.
- **Coordinated date** with broadcast slots; Steam pushes demos that publish ahead of their announced slot.

### Step 8 — generate the report

To `marketing/steam-page-review-YYYY-MM-DD.md`.

## Output format

```
GAME: <name>
APP ID: <if known>
PAGE STATE: <coming-soon | live | hidden>
REVIEW DATE: <YYYY-MM-DD>

CAPSULES
  Header capsule (460×215):     PASS | FAIL (<reason>) — <action>
  Small capsule (231×87):       ...
  Main capsule (1232×706):      ...
  Library capsule (600×900):    ...
  Library hero (3840×1240):     ...
  Library logo (1280×720):      ...
  Page background (1438×810):   ...

TRAILER
  Length:                       <seconds>
  First-6-second verb landed:   YES | NO — <fix>
  Studio card at start:         YES (cut it) | NO
  Subtitles default on:         YES | NO
  Quality concerns:             <list>

SHORT DESCRIPTION
  Character count:              <N>/300
  Hook sentence:                <quote>
  Cliché flags:                 <list or NONE>
  Genre word present:           YES | NO

TAGS
  Current:                      <list>
  Top-seller comparison:        <where the dev's set diverges>
  Recommended additions / cuts: <list>

SCREENSHOTS
  Count:                        <N>
  Hero screenshot strong:       YES | NO
  Variety score:                <one-line>
  Vertical-crop safe:           YES | mostly | NO

NEXT FEST FIT (if planning)
  <findings>

TOP 5 EDITS (ordered by wishlist-conversion impact)
  1. <edit> — <expected effect>
  2. ...

WISHLIST-CONVERSION RISK
  <LOW | MEDIUM | HIGH> — <one-paragraph summary>
```

## What NOT to do

- **Don't propose a "more cinematic trailer."** Cinematic trailers underperform for indie games. Show the verb.
- **Don't propose copying the top-seller's capsule.** Use them as reference for tag strategy and structure, not aesthetic.
- **Don't ignore the Library capsule.** Many indie devs treat it as optional; for buyers using their library frequently, it's the most-seen art they own from your game.
- **Don't critique the game design through the Steam page.** This is a marketing audit; design feedback belongs in `/plan-creative-director` or `/critique --lens=fun`.
- **Don't promise specific wishlist numbers.** Wishlist conversion depends on many factors; this audit improves the page, not the algorithm.

## Handoff

After steam-page-review:
- Apply top 3 edits.
- `/art-shotgun` — for capsule iterations if the audit found the main capsule weak.
- [`gamestack-steam-page-check`](../../bin/impl/steam-page-check/README.md) CLI — for automated capsule-size + trailer-length validation in CI.
- `/publish` — when the page is launch-ready and the game has passed cert.
- `/post-launch-monitor` — once shipped, tracks the wishlist-to-purchase conversion.
