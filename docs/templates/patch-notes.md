<!--
artifact: patch-notes
authored_by: patch-notes
schema_version: 1
when_written: "After every patch, before posting to Steam / itch / consoles."
-->

<!-- Two artifacts, two voices. /patch-notes writes both after a release tag is cut:
     - Player notes:    marketing/patch-notes/vX.Y.Z.md
     - Changelog entry: prepended to CHANGELOG.md (Keep-a-Changelog format)
-->

---

## Artifact 1 — Player-facing patch notes

<!-- File: marketing/patch-notes/vX.Y.Z.md
     Audience: a player who hasn't read the dev's posts and may have stopped playing weeks ago.
     Length: 5–15 lines for most patches; 30–50 lines for major updates. Never longer. -->

# <Game Name> — vX.Y.Z

<One-paragraph headline: the headline change, in the game's voice.>

## New
- <bullet — player-noticeable thing>

## Improved
- <bullet>

## Fixed
- <bullet>

## Heads up
- <bullet — anything intentional that might surprise returning players>

_<Localization note. Known issues. Thank-you line if it fits the tone.>_

---

## Artifact 2 — Dev-facing changelog entry

<!-- Prepended to the top of CHANGELOG.md.
     Audience: future-you, contributors, oncall.
     Tone: terse, technical, present tense.
     Coverage: every notable commit; PR # if available. -->

## [vX.Y.Z] - YYYY-MM-DD

### Added
- <one-liner>

### Changed
- <one-liner>

### Deprecated
- <one-liner>

### Removed
- <one-liner>

### Fixed
- <description> (#PR / #issue)

### Security
- <one-liner>
