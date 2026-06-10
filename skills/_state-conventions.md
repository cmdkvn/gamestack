# Skill ↔ state.json read/write conventions

This file is read by every gamestack skill. It defines the contract for reading and writing `<project>/gamestack/state.json`. Full schema lives at [`../docs/STATE.md`](../docs/STATE.md).

This file is **not a skill** — it has no frontmatter, no slash command, and `gamestack-skill-lint` skips it. It exists so the skills don't have to duplicate the same five paragraphs of state-handling instructions.

## Experience level

`project.experience` (`beginner | intermediate | expert`; missing ⇒ `expert`) is the
posture dial. Read it on entry alongside `phase` and `review_mode`.

- **beginner** — the developer may never have used a game engine or written much code.
  1. Define game-dev jargon in plain language the first time it appears in your output
     (or link `docs/GLOSSARY.md`). Don't gate progress on vocabulary.
  2. Skills that default to `[PROPOSE]` flip to **`[AUTO]`-with-explanation**: apply the
     change, then explain what changed and why in one or two sentences per change. Never
     hand a beginner a diff and ask them to apply it — they can't evaluate it, and the
     review/playtest skills are the safety net instead.
  3. Any step that happens in an engine editor GUI gets a narrated, click-by-click
     walkthrough ("In Godot: Scene → New Scene → ..."). Never assume editor familiarity.
  4. Prefer sensible defaults over questions. Ask only when the answer is taste.
- **intermediate** — ships software, new to games. Define game-dev-specific jargon.
  Keep `[PROPOSE]` defaults; they can read a diff.
- **expert** — pre-experience-axis behavior, unchanged. This is the default when the
  field is missing, so existing projects don't change behavior.

## On entry

Every skill except `/gamestack` and `/design-jam` does this:

1. Look for `gamestack/state.json` in the project root.
2. If absent, stop and reply:
   > "No `gamestack/state.json` found. Run `/gamestack` first to bootstrap the project, or `/design-jam` if you don't have a pitch yet."
3. If present, parse it. If `schema` is missing or unrecognized, reply:
   > "`gamestack/state.json` is from a newer gamestack version. Update gamestack or remove the file."
4. Check `project.phase`. If the skill doesn't fit the phase, redirect:
   - Build-phase skills in `launched`: → `/post-launch-monitor` or `/patch-notes`.
   - Polish-phase skills in `pitch` / `prototype`: → `/critique --lens=fun`.
   - Cert skills in any phase before `cert`: explain that the skill is calibrated for cert and ask if they want to run it anyway.
5. Read `project.experience` (default `expert` if absent). Apply the posture rules from the "Experience level" section for the rest of this skill's output.
6. Read the artifact paths under `artifacts.*` that this skill depends on. If the prerequisite artifact is missing, redirect to the skill that produces it (named in the skill's "Handoff" section).

## On exit

After the skill finishes its work:

1. If the skill produced an artifact, update `artifacts.<key>` with the path written.
2. Append to `recent_runs`:
   ```json
   {
     "skill": "<skill-name>",
     "lens": "<lens or null>",
     "at": "<ISO-8601 UTC timestamp>",
     "artifact": "<path or null>",
     "outcome": "ok | error | bailed"
   }
   ```
3. If `recent_runs` is longer than 20 entries, drop the oldest until length is 20.
4. Write the file back atomically: write to `gamestack/state.json.tmp`, then rename. Never half-write.
5. Do not touch fields the skill doesn't own. A code review skill does not change `phase`. Only the developer changes phase (via `/gamestack`).

## Phase transitions

Only the developer changes phase. Skills can recommend a transition via `/gamestack` (which the developer confirms), but skills never silently change `project.phase`.

## When to skip writes

A skill that bailed without producing useful output should still log the run with `outcome: "bailed"` so `/gamestack` can see the pattern and not re-recommend the same skill on the next turn.

A skill that the developer cancelled mid-flow should log `outcome: "error"` and not touch artifacts.

## Atomic write recipe

```
1. Read existing state.json (or initialize an empty one matching schema v1).
2. Compute the new state in memory.
3. Write to state.json.tmp.
4. fsync (best-effort).
5. Rename state.json.tmp → state.json.
```

The atomicity matters: a power-loss mid-write on a state file that drives skill recommendations is exactly the kind of save-data corruption the project warns developers to avoid in their own games.
