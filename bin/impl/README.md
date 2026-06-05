# gamestack CLI implementations

TypeScript/Bun implementations behind `gamestack/bin/gamestack-*` shims. Each shim is a tiny bash script that delegates to a Bun entry point in this directory.

## Layout

```
bin/impl/
├── package.json                 # Bun manifest (one workspace for all CLIs)
├── tsconfig.json
├── shared/                      # cross-CLI utilities
│   ├── args.ts                  # arg parser + common option parsing
│   ├── version.ts               # CLI version constant
│   ├── platforms.ts             # per-platform asset budget tables
│   ├── cert-categories.ts       # cert category definitions per platform
│   ├── steam-specs.ts           # Steam capsule specs + cliché patterns
│   ├── engine.ts                # Unity/Godot/Unreal/GameMaker/Bevy detection
│   ├── fs-walk.ts               # recursive walk with excludes
│   ├── report.ts                # markdown + JSON emit; --out handling
│   └── format.ts                # byte formatting, ISO date
├── asset-audit/
│   ├── index.ts                 # entry point
│   ├── audit.ts                 # core logic
│   ├── render.ts                # markdown renderer
│   ├── README.md
│   ├── audit.test.ts
│   └── __fixtures__/            # Unity-shaped test data
├── cert-checklist/
│   ├── index.ts
│   ├── check.ts
│   ├── render.ts
│   ├── README.md
│   ├── check.test.ts
│   └── __fixtures__/
└── steam-page-check/
    ├── index.ts
    ├── check.ts
    ├── render.ts
    ├── README.md
    ├── check.test.ts
    └── (fixtures generated programmatically in test setup)
```

## Develop

```bash
cd gamestack/bin/impl
bun install        # one-time
bun test           # runs every CLI's test suite
bunx tsc --noEmit  # type-check

# Run an entry point directly:
bun run asset-audit/index.ts --platform pc --project ../../some/project
```

## Conventions

- **No runtime dependencies on Node-only APIs.** Bun is the runtime. The CLIs read with `node:fs` (Bun-compatible) and stay off of `worker_threads` / `cluster`.
- **Shared modules go in `shared/`.** Each CLI imports from `../shared/<module>.ts` — no cross-CLI imports.
- **Reports emit two artifacts.** Markdown for humans, JSON for CI. `shared/report.ts` handles `--format md|json|both` and `--out`.
- **Exit codes follow the same scheme.** `0` = clean, `1` = findings above the failure threshold (CI fail), `2` = invalid args / unreadable project, `127` = `bun` missing (raised by the shim, not the TS).
- **No auto-fix.** The CLIs write reports. The interactive skills propose fixes; the developer applies them.

## Adding a new CLI

1. Create `bin/impl/<name>/` with `index.ts`, the core module, a `render.ts`, a `<name>.test.ts`, and a `README.md`.
2. Add `bin/gamestack-<name>` shim (copy an existing shim and swap the path).
3. Add a script entry in `package.json` for ergonomic local runs (`"<short>": "bun run <name>/index.ts"`).
4. Update `gamestack/README.md` CLI table, `gamestack/docs/skills.md` CLI section, and `gamestack/bin/.gitkeep` planning notes.
5. Update the cross-reference inside the matching skill's SKILL.md so the skill points to the CLI.

The 7 planned CLIs (M3 + M4) are listed in `gamestack/bin/.gitkeep`.

## See also

- `gamestack/docs/PLAN.md` — milestone plan
- `gamestack/skills/<name>/SKILL.md` — the interactive sibling for each CLI
