# How to ship a game on a Tuesday morning

The promise of gamestack on ship day is *not heroism.* Launches go well when the panic is replaced by a script and the script is replaced by a checklist. This walkthrough takes a single Tuesday — from the rehearsal the night before through the first hotfix two days later — and shows what every meaningful action looks like when the right specialists are gating the keyboard.

The example game is **Bridge Keeper** — a 4-hour single-player puzzle game about deciding who crosses an old bridge in a winter mountain pass. Switch eShop, $14.99, lotcheck passed last Friday. One developer. Ship time: Tuesday 10:00 ET.

Don't take the example seriously. The point is the *shape* of the day.

## T-1 day, 16:00 ET: rehearsal (`/cert-freeze` is still on)

The Switch build cleared lotcheck on Friday. `cert-freeze` is still active from that submission window. The game's `CLAUDE.md` reads `phase: Cert`. Tomorrow morning that phase moves to `Launched`. Tonight you rehearse, you don't ship.

Open Claude Code in `games/bridge-keeper/` and surface what's locked:

```
CERT-FREEZE — restricted to:
  - Builds/Switch/
  - docs/cert/
  - playtest/cert-readiness/

CAREFUL is on. Destructive ops require confirmation.

Last cert-readiness run: 2026-05-29 (7 days ago).
  Switch: PASS — 0 P0, 0 P1.
Last playtest: 2026-05-30 — 04-cert-controller-disconnect.json PASS, 05-cert-save-fuzz.json PASS.
```

7 days is the staleness ceiling for [`/cert-readiness`](../../skills/cert-readiness/SKILL.md). Re-run the save-fuzz scenario tonight so tomorrow's pre-flight has a fresh signal:

```
/playtest 05-cert-save-fuzz
```

```
SCENARIO: 05-cert-save-fuzz
  ✓ snapshot at slot=0, played 2 minutes, restored
  ✓ snapshot mid-cutscene, restored — no orphaned animator state
  ✓ snapshot during save-write, killed process, relaunched — slot intact
  ✓ snapshot on Switch dock transition — no regression
  PASS  (run-id: 2026-06-04-20-cert-save-fuzz)
```

Good. Sleep on it.

## T-1 hour, 09:00 ET: pre-flight ritual (`/launch-day`)

Coffee. Open Claude Code. Lift the cert freeze; you're not editing cert-zone files anymore, you're shipping a build out of it.

```
/cert-pass
/launch-day
```

The Release Engineer surfaces the ship-day stance:

```
LAUNCH-DAY — active.
  CAREFUL: on
  FREEZE:  Builds/, marketing/steam/, marketing/eshop/,
           playtest/post-launch-monitor/,
           ROADMAP.md, CHANGELOG.md, README.md
  LOG:     verbose (intent before, result after, every write)

Pre-flight check:
  - Latest cert:                  2026-05-29 (Switch, PASS)
  - Latest cert-readiness:        2026-05-29 — verdict GO
  - Latest steam-page-review:     N/A (Switch eShop only)
  - Latest playtest:              2026-06-04 (cert-save-fuzz PASS)
  - Outstanding TODOs in launch-affecting code: 0
  - Day of week:                  Tuesday  ✓ not Friday

Pre-flight reads green. Proceed when ready.
```

The verbose-intent gate is what makes this skill different from a normal session. Every write surfaces a one-line "what could go wrong" before it happens. This is not optional; it's the discipline.

Read [`/launch-day`](../../skills/launch-day/SKILL.md) once more if you've never run it under load. The discipline reads patronizing on a quiet day. It reads correct at T-3 minutes when a build is uploading and someone sends you a Slack message.

## T-30 min, 09:30 ET: cut the release (`/publish`)

You have a tagged build from yesterday's release-candidate run, but `/publish` is what makes it official.

```
/publish target=switch version=1.0.0
```

The Release Engineer walks the gates one by one. Don't skim; this output exists because each line has burned a previous launch:

```
PUBLISH RUN — bridge-keeper v1.0.0 to switch

PRE-PUBLISH GATES
  ✓ Cert (Switch lotcheck PASS, 2026-05-29)
  ✓ No P0 bugs              (playtest/regression/ clean)
  ✓ Tests passed            (Unity play-mode, 47/47)
  ✓ Version unique          (v1.0.0 tag does not exist)
  ✓ Branch clean            (no uncommitted changes)
  ✓ Build = commit          (Builds/Switch/bridge-keeper-1.0.0.nsp ←
                             tag candidate 7f3a91c)
  ✓ Not Friday-after-2      (Tuesday 09:31 ET)
  ✓ Documents current       (README, accessibility report, CHANGELOG
                             all touched within 48h)
```

Eight green checks. Now the version bump, as an atomic commit so a rollback is one revert:

```
VERSION BUMP
  v0.9.4-rc → v1.0.0
  Files updated:
    - ProjectSettings/ProjectSettings.asset  (bundleVersion)
    - CHANGELOG.md                           (new entry header)
    - games/bridge-keeper/CLAUDE.md          (phase: Cert → Launched)
  Commit: chore(bridge-keeper): bump to v1.0.0   (sha 4c1b8e2)
```

The last-mile cert items get re-run condensed. Even with lotcheck PASS, the highest-failure-rate items get one more pass on the actual binary going out:

```
LAST-MILE CERT CHECK
  ✓ Sleep/resume       (dock → undock → sleep 30s → resume; save intact)
  ✓ Controller disconnect during gameplay (rejoin, no soft-lock)
  ✓ playtest/regression smoke pass (12/12)
  ✓ Accessibility verified ON (subtitles default-on, remap working)
  ✓ Build size 412 MB (Switch cap: 32 GB, plenty of room)
  ✓ Localization spot check (DE / FR / JA / KO — no truncation at +30% width)
```

Then the build itself. The Switch path is intentionally not auto-uploaded — `/publish` will not push to a console partner portal under any circumstances. It surfaces the build path and the manual checklist:

```
BUILD
  Target: switch
  Output: Builds/Switch/bridge-keeper-1.0.0.nsp
  Size:   412 MB

UPLOAD — MANUAL (console partner portal)
  1. Open the Nintendo Developer Portal in your browser.
  2. Navigate: bridge-keeper → Master → Submit Build.
  3. Upload: Builds/Switch/bridge-keeper-1.0.0.nsp
  4. Confirm SKU, age rating (PEGI 7 / ESRB E10+), launch window (Tue 10:00 ET).
  5. Verify the eShop description and screenshots match marketing/eshop/.
  6. Hit Submit. Do NOT close the browser tab until the portal confirms.

  Return here once the portal shows "Live" so /publish can tag and update ROADMAP.
```

This is the part of launch day that no skill can do for you. Sit with the portal. Read every field. Twice. The cost of pushing the wrong build to live is greater than the cost of being twelve minutes slow.

You upload. The portal accepts it. The build is queued for 10:00 ET release on the storefront.

## T-10 min, 09:50 ET: tag, ROADMAP, hold the tweet

Back in Claude Code, `/publish` resumes once you confirm the portal accepted the upload:

```
> Portal accepted v1.0.0. Live at 10:00 ET.

TAG & PR
  Tag:   v1.0.0 (pushed to origin)
  PR:    #142 — "release: bridge-keeper v1.0.0" opened

ROADMAP
  Updated — moved bridge-keeper to Shipped: 2026-06-05.

GAME CLAUDE.md
  Phase: Cert → Launched

NEXT
  - Enable /post-launch-monitor daily for the first 30 days.
  - Plan first patch window (usually T+7 unless P0 surfaces earlier).
  - DO NOT post the launch tweet until the storefront shows the game live.
```

That last line is load-bearing. The classic launch-day mistake is the developer tweeting "we're live!" at T-5 because the portal said "scheduled" and the storefront says "soon." Posting before the build is live converts every excited click into a frustrated one. Wait for the storefront.

You drafted the launch tweet last week. It sits in `marketing/social/launch-tweet.md`. It is not posted yet.

## T-0, 10:00 ET: storefront live

You watch the Switch eShop on a second device. At 10:00:14 ET the listing flips from "Available 6/5" to "Buy". You buy it on the spot — that confirms the SKU end-to-end. You start the download. You play through the first save-load round-trip on the live build.

Now the tweet goes out. The Discord announcement goes out. The press list goes out. None of these were posted before the storefront flipped.

Back in Claude Code:

```
LAUNCH-DAY — write marketing/social/launch-day-log.md.
Why now: the storefront is live; capture the timestamp before memory drifts.
What could go wrong: misremembering the exact go-live time loses signal for post-mortem.
Roll-back if it does: not applicable (additive log entry).
```

```
LAUNCH-DAY — write marketing/social/launch-day-log.md done.
Verified: file exists, contains "2026-06-05T14:00:14Z storefront live".
```

The verbose-intent / verified pattern looks excessive for a one-line log. It's the muscle you want grooved for the writes that matter — for the Steam page hotfix at T+45 min, for the patch tag at T+2 days.

## T+15 min, 10:15 ET: first baseline (`/post-launch-monitor`)

Fifteen minutes after live is the right time for the baseline capture. Reviews haven't started; the early sales spike has begun.

```
/post-launch-monitor
```

The Live Ops engineer notes there's no baseline yet and creates one:

```
GAME: bridge-keeper
DAYS SINCE LAUNCH: 0
DATE: 2026-06-05

No baseline.md found in playtest/post-launch/. Creating from today's data.

BASELINE WRITTEN: playtest/post-launch/baseline.md
  Launch date:        2026-06-05
  Platform:           Switch eShop
  Launch peak CCU:    n/a (Switch eShop does not expose live CCU)
  Reviews (15 min):   0
  Crash rate:         0 (no telemetry hookup; will proxy via reviews)
  Refund rate:        n/a (eShop refund policy is per-territory)
  Wishlist conv.:     n/a (Switch does not expose wishlists)

SIGNALS
  All signals are at the t=0 mark by definition.

NEXT RUN: 11:00 ET (1 hour post-launch) for early-signal pass.
```

Switch is a leaner signal environment than Steam. No live CCU number, no wishlist conversion. The skill doesn't pretend otherwise — it captures what's available and flags the rest as `n/a`. Read [`/post-launch-monitor`](../../skills/post-launch-monitor/SKILL.md) for the full lens; the Switch-flavored version is a subset.

## T+1 hour, 11:00 ET: first real digest

```
/post-launch-monitor
```

```
GAME: bridge-keeper
DAYS SINCE LAUNCH: 0 (1 hour in)
DATE: 2026-06-05

SIGNALS

  Reviews (eShop user ratings + early Reddit / forum mentions):
    Ratings count:        2  (one 5-star, one 4-star)
    Sentiment proxy:      positive — see /r/NintendoSwitch thread linked below
    Classification:       GREEN (sample too small for signal, but no fires)

  Crash rate:
    Source:               PROXY via reviews / forum mentions
    24h proxy rate:       0% (no crash mentions)
    Classification:       GREEN

  Player count:
    No public Switch CCU API. Tracking via download-count screenshot at 11:00:
    Downloads (portal):   ~840
    Classification:       GREEN (early hour, no baseline for comparison)

  Community complaints (top 3):
    1. None at hour 1. /r/NintendoSwitch launch-day thread has 6 comments,
       all anticipatory or congratulatory.

  Refund rate / wishlist conversion: n/a on Switch.

ACTION RECOMMENDATIONS

  Hotfix (today):                none
  Patch (T+3 to T+7):            none
  Next planned update:           none yet
  Backlog:                       none

PATCH CADENCE RECOMMENDATION
  Hour 1 is too early for signal. Hold. Re-run at end-of-day (T+8h) and
  again tomorrow morning. Do not patch on hour-1 data.

DIGEST WRITTEN TO: playtest/post-launch/digest-2026-06-05-1100.md
NEXT RUN: 18:00 ET (end of day)
```

The "hold" recommendation is the part to internalize. Hour 1 is sample noise. The discipline is to *not patch on hour-1 data* even when something looks scary. Especially when something looks scary.

You close the laptop. You go for a walk. The launch is live; the muscle is rest.

## T+2 days, Thursday 09:00 ET: the first real bug

Wednesday's digest came back YELLOW: three forum posts mentioning that save slot 3 sometimes shows a stale thumbnail after returning from sleep. Not a crash, not a data loss — a UI staleness. One post, then another two on Thursday morning.

```
/post-launch-monitor
```

```
GAME: bridge-keeper
DAYS SINCE LAUNCH: 2
DATE: 2026-06-07

SIGNALS

  Reviews:
    Count:                47 (eShop) + 12 (Switch news threads)
    Sentiment:            44 positive / 3 neutral on eShop. Forum sentiment
                          mostly positive; one repeating complaint surfacing.
    Δ 24h:                +29 reviews, +91% positive maintained.
    Classification:       GREEN overall, with one YELLOW pattern.

  Crash rate (proxy):     0%  GREEN
  Player count:           ~3,100 cumulative downloads.

  Community complaints (top 3):
    1. Save slot 3 thumbnail shows previous run after sleep/resume
       — 6 mentions — Bug — file regression scenario, fix in v1.0.1
    2. "Wish there were more chapters"
       — 4 mentions — Design pushback — note, do not patch
    3. Subtitle font feels small on handheld
       — 2 mentions — Polish gap — backlog for v1.0.2

ACTION RECOMMENDATIONS

  Hotfix (today):            none — the thumbnail bug is cosmetic, not data loss
  Patch (T+3 to T+7):        save-slot-3 thumbnail fix → v1.0.1
  Next planned update:       subtitle handheld scaling → v1.0.2
  Backlog:                   "more chapters" — not a patch candidate

PATCH CADENCE RECOMMENDATION
  Fix the slot-3 thumbnail this week. The bug is cosmetic so it does not
  warrant a same-day hotfix, but it is a clear pattern and players are
  noticing. Aim for v1.0.1 ship Saturday morning (T+4). Skip Friday.
```

The classification is doing real work. A cosmetic bug with a clear pattern is RED for patch consideration but not EMERGENCY. The skill is willing to say "do not patch today" even when there is a real bug. That distinction is what protects you from launch-week thrash.

You fix the thumbnail cache invalidation in `SaveSlotPanel.cs` — two-line change, the slot was reading from the in-memory cache instead of disk after a sleep/resume. You add a regression scenario `06-post-launch-slot3-thumbnail.json`. You re-run [`/playtest`](../../skills/playtest/SKILL.md). Green.

## T+2 days, Thursday 14:00 ET: ship v1.0.1 (`/publish` + `/patch-notes`)

```
/publish target=switch version=1.0.1
```

Same gates, same last-mile cert items, same manual upload to the portal. The Switch build process for a small patch is structurally identical to v1.0.0 — that's the point of the skill. There is no "easier path for small patches." Easier paths are how stale lotcheck items ship.

The Friday rule is implicit here too. Thursday afternoon is fine; the patch lands well before Friday-after-2. If this were Friday at 15:00, the skill would warn and require `--confirm-friday`. Don't override without thinking.

After the tag is pushed:

```
/patch-notes v1.0.1
```

The Technical Writer reads the diff (`git log v1.0.0..v1.0.1`), the closed issue (#143), and the game's tone notes (`design/voice-cards.md` describes Bridge Keeper as "quiet, observational, never jokey"). It writes two artifacts:

```
PLAYER NOTES — marketing/patch-notes/v1.0.1.md

# Bridge Keeper — v1.0.1

A small fix for save slot 3.

## Fixed
- Save slot 3 now shows the correct thumbnail after returning from sleep.

_Thanks to the players who reported this in the first 48 hours._
```

```
CHANGELOG ENTRY — prepended to CHANGELOG.md

## [v1.0.1] - 2026-06-07

### Fixed
- SaveSlotPanel.cs — slot 3 thumbnail cache was not invalidated on
  resume; now reads from disk on focus regain. (#143)
```

Two audiences, two registers. Read [`/patch-notes`](../../skills/patch-notes/SKILL.md) for the full lens. The player notes do not mention "cache invalidation"; the changelog does not say "a small fix." Mixing them is what produces patch notes nobody reads.

You post the player notes to the eShop news tab once the v1.0.1 build is live. Not before.

## What just happened

In one ship day plus a small patch you went from:

- A frozen Cert-phase project with a passed lotcheck (Monday night).
- A pre-flight check that surfaced eight green gates and zero stale signals (Tuesday 09:00 ET).
- A `/publish` run that bumped the version atomically, re-ran the last-mile cert items, and surfaced the manual upload checklist for the Switch portal (Tuesday 09:30 ET).
- A storefront-confirmed live build before any marketing went out (Tuesday 10:00 ET).
- A baseline + a real-data digest at hour 1 with the explicit recommendation to *not patch on hour-1 data* (Tuesday 11:00 ET).
- A T+2 digest that distinguished a real bug pattern from a design pushback and a polish gap, and recommended fixing the bug *this week* but not *today* (Thursday 09:00 ET).
- A v1.0.1 release with patch notes pitched at two distinct audiences (Thursday 14:00 ET).

The skills do not ship the game. They keep you from shipping in the order that breaks launches: tweet first, build second, audit later. They make the right order the path of least resistance.

## What comes next

- **Days 3–7.** Run [`/post-launch-monitor`](../../skills/post-launch-monitor/SKILL.md) every morning. Categorize complaints. Don't conflate a loud minority with data.
- **Week 2.** First planned content patch if the design backlog has earned it. Run [`/onboarding-audit`](../../skills/onboarding-audit/SKILL.md) against the first-60-seconds data the launch produced.
- **Day 30.** Drop the monitor cadence to weekly. Read [`/post-mortem`](../../skills/post-mortem/SKILL.md) and write the honest one — what worked, what didn't, what you'd tell yourself before the next launch.
- **Day 90.** First sale window. The patch backlog should be empty; the next-game pitch should be open in another tab.

## Related

- [`/publish`](../../skills/publish/SKILL.md) — the release engineer that gates the ship.
- [`/launch-day`](../../skills/launch-day/SKILL.md) — the discipline mode for the day itself.
- [`/post-launch-monitor`](../../skills/post-launch-monitor/SKILL.md) — daily signal digest.
- [`/patch-notes`](../../skills/patch-notes/SKILL.md) — two-audience release writing.
- [`/cert-freeze`](../../skills/cert-freeze/SKILL.md) — the freeze that lifts the morning of launch.
- [`/cert-readiness`](../../skills/cert-readiness/SKILL.md) — the audit that earns the GO.
- [`/playtest`](../../skills/playtest/SKILL.md) — the regression scenarios that catch the cosmetic bugs.
- The prior tutorial: [howto-first-game-in-an-hour](howto-first-game-in-an-hour.md) for the start of the arc that ends here.
