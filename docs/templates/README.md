# Artifact templates

Canonical schemas for the 13 artifacts gamestack skills produce. These are the source of truth — skills link to their template instead of inlining the format inside `SKILL.md`.

## How to read these

Every template is a markdown file with:
- HTML-comment frontmatter (`artifact`, `produced_by`, `schema_version`, `when_written`)
- Section headings lifted verbatim from the owning skill's output spec
- `{{double-curly}}` placeholders for fields the developer fills in
- `<!-- HTML comments -->` for inline guidance

To use one as a starting point in your game project: copy the file to your project's `design/` (or whatever path the skill writes to), strip the comment-frontmatter, fill in the placeholders.

## How to add a new template

1. Find the skill whose output you want to canonicalize (e.g., `skills/<name>/SKILL.md`).
2. Lift its output schema verbatim into `docs/templates/<artifact>.md` using the format conventions above.
3. Edit the skill's SKILL.md to replace the inline schema with `**Output:** see [`docs/templates/<artifact>.md`](../../docs/templates/<artifact>.md).`
4. Run `bin/gamestack-skill-lint --warn-as-error` to verify the link.
5. Add a row to the index below.

## Index

| Template | Artifact path (game project) | Produced by | Consumed by |
|---|---|---|---|
| [`pitch.md`](pitch.md) | `design/pitch.md` | `/design-jam` | `/plan-*`, `/critique`, `/scene-prototype` |
| [`mechanics.md`](mechanics.md) | `design/mechanics.md` or `design/game-design.md` | `/plan-game-design` | `/scene-prototype`, `/balance-review`, `/critique` |
| [`narrative.md`](narrative.md) | `design/narrative.md` | `/plan-narrative` | `/dialogue-write`, `/dialogue-review` |
| [`voice-cards.md`](voice-cards.md) | `design/voice-cards.md` | `/plan-narrative`, `/dialogue-write` | `/dialogue-write`, `/dialogue-review`, `/patch-notes` |
| [`art-direction.md`](art-direction.md) | `design/art-direction.md` | `/plan-art-direction` | `/art-bible`, `/art-shotgun`, `/scene-prototype` |
| [`art-bible.md`](art-bible.md) | `design/art-bible.md` | `/art-bible` | `/art-shotgun`, `/asset-audit`, `/scene-prototype` |
| [`audio-direction.md`](audio-direction.md) | `design/audio-direction.md` | `/plan-audio-direction` | `/asset-audit`, `/critique --lens=feel` |
| [`level-design.md`](level-design.md) | `design/level-design.md` | `/plan-level-design` | `/scene-prototype`, `/dialogue-write`, `/critique --lens=pacing` |
| [`tech-design.md`](tech-design.md) | `design/tech-design.md` | `/plan-tech-design` | `/scene-prototype`, `/code-review-gamestack`, `/asset-audit` |
| [`post-mortem.md`](post-mortem.md) | `design/post-mortems/<date>.md` | `/post-mortem` | `/learn` |
| [`patch-notes.md`](patch-notes.md) | `patch-notes/<version>.md` | `/patch-notes` | release pipeline (`/publish`) |
| [`cert-readiness.md`](cert-readiness.md) | `cert/<platform>.md` | `/cert-readiness` | `/publish`, `/cert-freeze` |
| [`plan-review.md`](plan-review.md) | `design/reviews/plan-<discipline>.md` | every `/plan-*` skill | `/autoplan`, `/post-mortem` |

## Note on placement

These templates live in the gamestack repo at `docs/templates/`. They are documentation. They are NOT files a consuming game project copies in bulk — a game project's artifacts live under that project's `design/` directory, written by the skills that own them.
