# gamestack-steam-page-check

Steam store page validator. CI-friendly wrapper around the lens that the interactive `/steam-page-review` skill uses (Marketing Lead).

## Install

```bash
brew install bun                                 # runtime; one-time
gamestack/bin/gamestack-steam-page-check --help
```

## Usage

```bash
gamestack-steam-page-check --project ./games/bridge-keeper
gamestack-steam-page-check --steam-dir ./marketing/v2 --format json --out steam.json --strict
```

### Common flags

| Flag | Default | Notes |
|---|---|---|
| `--project <path>` | `$PWD` | Project root. CLI auto-discovers `marketing/steam/` (or `marketing/`, or `steam/`). |
| `--steam-dir <path>` | auto-discover | Override Steam asset directory. |
| `--format <md\|json\|both>` | `md` | Markdown to stdout by default. |
| `--out <path>` | — | Write report to a file. With `--format=both` the CLI writes `<out>.md` and `<out>.json`. |
| `--strict` | off | Exit non-zero on MEDIUM or HIGH wishlist risk as well as missing capsules. |

### Exit codes

| Code | Meaning |
|---|---|
| `0` | No high-impact violations. |
| `1` | Missing/failed main or header capsule, or `--strict` and risk is not LOW. |
| `2` | Invalid args. |
| `127` | `bun` not installed. |

## Expected layout

```
<project>/marketing/steam/
├── page.json                   # required for description / tag / trailer checks
├── header-capsule.png          # 460×215   (hint: "header")
├── small-capsule.png           # 231×87    (hint: "small")
├── main-capsule.png            # 1232×706  (hint: "main", "page-capsule")
├── library-capsule.png         # 600×900   (hint: "library", "library-capsule")
├── library-hero.png            # 3840×1240 (hint: "library-hero", "hero")
├── library-logo.png            # 1280×720  (hint: "library-logo", "logo")
├── page-background.png         # 1438×810  (hint: "page-background", "background")
├── screenshots/                # *.png — used for count if page.json omits screenshotsCount
└── trailer.mp4                 # optional; the CLI reads trailerSeconds from page.json
```

The CLI matches capsule files by filename hints, so any of these work:
- `main-capsule.png`, `main.png`, `page-capsule-main.png`

### page.json schema

Every field is optional. Provide the fields you want the CLI to check.

```json
{
  "appId": 12345,
  "pageState": "coming-soon",
  "shortDescription": "A 60-second roguelike about cooking soup in space. 30 ingredients, infinite weather.",
  "longDescription": "...BBCode or markdown...",
  "tags": ["Roguelike", "Cooking", "Atmospheric", "Pixel Art", "Singleplayer"],
  "trailerSeconds": 75,
  "trailerHasSubtitles": true,
  "trailerHasStudioCardAtStart": false,
  "trailerFirstSixSecondVerb": true,
  "screenshotsCount": 8,
  "nextFest": { "planned": true, "demoMinutes": 25, "demoEndsOnHook": true }
}
```

## What it checks

| Check | How it fails |
|---|---|
| **Capsule dimensions** | Any slot whose actual dimensions don't match the Steam spec exactly. Main + header are weighted highest because they drive browse-view clicks. |
| **Trailer length** | Outside 60–90s sweet spot (warn). Over 120s (fail). |
| **Trailer first 6s** | `trailerFirstSixSecondVerb: false` (verb not landed in first 3 seconds). |
| **Trailer studio card** | `trailerHasStudioCardAtStart: true` (move to outro). |
| **Trailer subtitles** | `trailerHasSubtitles: false` (Steam auto-plays muted). |
| **Short description** | >300 chars; clichés ("epic adventure", "embark on a journey", "vast world", …); bullet-list/checkmark "feature list"; missing genre word. |
| **Tags** | Outside 5–15; fewer than 3 genre-leading tags; fewer than 2 vibe tags. |
| **Screenshots** | Count under 5. |
| **Next Fest fit** | Demo outside 15–30 min sweet spot; demo doesn't end on a hook. |

### Wishlist-conversion risk verdict

| Risk | Meaning |
|---|---|
| `LOW` | All high-impact lanes pass — iterate. |
| `MEDIUM` | 1–2 lanes need work — recoverable before launch. |
| `HIGH` | 3+ lanes need work — wishlist conversion will lag genre baseline. |

## What it does NOT do (vs. the `/steam-page-review` skill)

- **Doesn't compare against current top-sellers in your genre.** The skill walks 5 successful neighbors and surfaces specific tag-strategy / capsule / hook divergences. The CLI catches mechanical issues only.
- **Doesn't parse the trailer file.** The CLI reads `trailerSeconds` from `page.json`. The skill watches the trailer and surfaces pacing/audio issues a JSON can't capture.
- **Doesn't generate alternate capsule concepts.** That's `/art-shotgun`'s job after the audit flags weak capsules.
- **Doesn't promise wishlist numbers.** Conversion depends on many factors; the risk verdict is a relative signal, not an absolute forecast.

Use the CLI before every push to the store page; use the skill before launch and at every Next Fest entry.

## Example CI usage

```yaml
# .github/workflows/steam-page-check.yml
on:
  pull_request:
    paths: [ "marketing/steam/**", "marketing/page.json" ]
jobs:
  steam-page-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: gamestack-steam-page-check --format json --out steam.json --strict
      - if: always()
        uses: actions/upload-artifact@v4
        with:
          name: steam-page-check
          path: steam.json
```

## JSON shape

```json
{
  "generatedAt": "2026-06-04",
  "projectRoot": "/abs/path",
  "steamDir": "/abs/path/marketing/steam",
  "appId": 12345,
  "pageStateRaw": "coming-soon",
  "capsules": [
    { "slot": "header", "expectedWidth": 460, "expectedHeight": 215, "file": "header-capsule.png", "actualWidth": 460, "actualHeight": 215, "verdict": "PASS", "reason": "..." }
  ],
  "trailer": { "lengthSec": 75, "firstSixSecondVerb": true, "studioCardAtStart": false, "hasSubtitles": true, "withinSweetSpot": true, "reasons": [] },
  "shortDescription": { "characterCount": 178, "withinLimit": true, "clicheFlags": [], "featureListFlag": false, "genreWordPresent": true },
  "tags": { "count": 5, "withinRange": true, "genreTagCount": 2, "vibeTagCount": 2, "unknownTags": ["Cooking"], "recommendedAdditions": [] },
  "screenshots": { "count": 8, "withinMinimum": true },
  "nextFest": { "planned": true, "demoLengthOk": true, "demoEndsOnHook": true, "reasons": [] },
  "topEdits": [],
  "wishlistRisk": "LOW",
  "wishlistRiskReason": "..."
}
```

## Related

- `/steam-page-review` skill — interactive Marketing Lead; compares the page against current top-sellers in your genre and recommends taste edits.
- `/art-shotgun` — for capsule iterations when the audit flags the main capsule.
- `/publish` — when the page is launch-ready and the game has passed cert.
- `/post-launch-monitor` — tracks wishlist-to-purchase conversion once shipped.
