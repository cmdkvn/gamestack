# Artifact templates

Canonical schemas for the 13 artifacts that gamestack skills either **author** (write directly) or **audit** (review against the schema). These are the source of truth — skills link to their template instead of inlining the format inside `SKILL.md`.

## How to read these

Every template is a markdown file with:
- HTML-comment frontmatter (`artifact`, `authored_by` *or* `audited_by`, `schema_version`, `when_written`)
- Sections lifted verbatim from the owning skill's structure (which may be `##` headings, a fenced code block, or a table — match the source's format)
- `{{double-curly}}` placeholders for fields the developer fills in
- `<!-- HTML comments -->` for inline guidance

To use one as a starting point in your game project: copy the file to the destination shown in the index below, strip the comment-frontmatter, fill in the placeholders.

## Authored vs audited

- **Authored by a skill** — the skill writes the file (e.g., `/design-jam` produces `pitch.md`). The SKILL.md says `**Output:**`.
- **Authored by the developer** — the developer writes the file directly (often after a planning conversation). A `/plan-*` skill then audits it against the template. The SKILL.md says `**Reads:**`.
- **Audited by a skill** — every `/plan-*` skill checks an existing design doc against the relevant template and emits a review to `design/reviews/plan-<discipline>.md` (schema: `plan-review.md`).

## How to add a new template

1. Decide who authors the artifact: a skill, or the developer.
2. Lift the structure verbatim into `docs/templates/<artifact>.md` using the conventions above.
3. Edit the relevant SKILL.md:
   - If a skill authors the artifact: replace inline schema with `**Output:** write to <path> — schema: see [`docs/templates/<artifact>.md`](../../docs/templates/<artifact>.md).`
   - If the developer authors and a skill audits: replace inline schema with `**Reads:** `<path>` — schema: see [`docs/templates/<artifact>.md`](../../docs/templates/<artifact>.md).`
4. Run `bin/gamestack-skill-lint --warn-as-error` to verify the link.
5. Add a row to the index below.

## Index

| Template | Artifact path (game project) | Authored by | Audited by | Consumed by |
|---|---|---|---|---|
| [`pitch.md`](pitch.md) | `design/pitch.md` | `/design-jam` | `/plan-creative-director` | `/plan-*`, `/critique`, `/scene-prototype` |
| [`mechanics.md`](mechanics.md) | `design/mechanics.md` | developer | `/plan-game-design` | `/scene-prototype`, `/balance-review`, `/critique` |
| [`narrative.md`](narrative.md) | `design/narrative.md` | developer | `/plan-narrative` | `/dialogue-write`, `/dialogue-review` |
| [`voice-cards.md`](voice-cards.md) | `design/voice-cards.md` | `/plan-narrative`, `/dialogue-write` | — | `/dialogue-write`, `/dialogue-review`, `/patch-notes` |
| [`art-direction.md`](art-direction.md) | `design/art-direction.md` | developer | `/plan-art-direction` | `/art-bible`, `/art-shotgun`, `/scene-prototype` |
| [`art-bible.md`](art-bible.md) | `design/art-bible.md` | `/art-bible` | — | `/art-shotgun`, `/asset-audit`, `/scene-prototype` |
| [`audio-direction.md`](audio-direction.md) | `design/audio-direction.md` | developer | `/plan-audio-direction` | `/asset-audit`, `/critique --lens=feel` |
| [`level-design.md`](level-design.md) | `design/level-design.md` | developer | `/plan-level-design` | `/scene-prototype`, `/dialogue-write`, `/critique --lens=pacing` |
| [`tech-design.md`](tech-design.md) | `design/tech-design.md` | developer | `/plan-tech-design` | `/scene-prototype`, `/code-review-gamestack`, `/asset-audit` |
| [`post-mortem.md`](post-mortem.md) | `studio/retros/YYYY-WW.md` | `/post-mortem` | — | `/learn` |
| [`patch-notes.md`](patch-notes.md) | `marketing/patch-notes/vX.Y.Z.md` | `/patch-notes` | — | release pipeline (`/publish`) |
| [`cert-readiness.md`](cert-readiness.md) | `playtest/cert-readiness/<platform>-YYYY-MM-DD.md` | `/cert-readiness` | — | `/publish`, `/cert-freeze` |
| [`plan-review.md`](plan-review.md) | `design/reviews/plan-<discipline>.md` | every `/plan-*` skill | — | `/autoplan`, `/post-mortem` |

## Note on placement

These templates live in the gamestack repo at `docs/templates/`. They are documentation. They are NOT files a consuming game project copies in bulk — a game project's artifacts live under that project's `design/` directory, written by the skills (or developer) that own them.
