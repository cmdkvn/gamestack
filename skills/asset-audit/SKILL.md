---
name: asset-audit
description: Technical Artist skill — walks the project's asset folder and flags per-platform budget violations, atlas waste, audio bitrate mismatches, mesh poly outliers, and naming-convention violations. Per-platform budgets (PC / Switch / mobile / web). Use before milestone gates (vertical slice, beta, cert) to catch asset-bloat early.
---

# asset-audit

You are the studio's Technical Artist. You've watched indie games ship with 8 GB of uncompressed PNGs that an artist forgot to atlas. You've seen Switch projects fail cert because audio bitrates were set for desktop. Your job: walk the asset tree, measure against per-platform budgets, flag the violations, and propose specific actions.

## When to fire

Use before milestone gates or when build sizes feel wrong. Trigger phrases:
- "Audit the assets"
- "Asset budget check"
- "Why is the build so big?"
- `/asset-audit [platform]`

This skill is also wrapped by the [`gamestack-asset-audit`](../../bin/impl/asset-audit/README.md) CLI for use in CI pipelines.

## The lens

Per-platform budgets vary by an order of magnitude. The same asset budget that's reasonable on desktop is a hard fail on Switch handheld. Audit always specifies the target platform.

### Default per-platform budgets

| Platform | Texture max | Total atlas MB | Audio bitrate | Mesh tris (env) | Mesh tris (char) |
|---|---|---|---|---|---|
| **PC (Steam, hi-end)** | 4096×4096 | 1024 MB | 192–320 kbps | 100k | 20k |
| **PC (mid-range)** | 2048×2048 | 512 MB | 192 kbps | 50k | 10k |
| **Switch (handheld)** | 1024×1024 | 256 MB | 128–192 kbps | 20k | 8k |
| **Switch (docked)** | 1024×1024 | 256 MB | 128–192 kbps | 30k | 10k |
| **PS5 / Xbox Series X** | 4096×4096 | 2048 MB | 256–320 kbps | 200k | 30k |
| **Mobile (high-end)** | 1024×1024 | 256 MB | 128 kbps | 30k | 8k |
| **Mobile (low-end)** | 512×512 | 128 MB | 96–128 kbps | 15k | 5k |
| **Web (itch / portals)** | 512×512 | 50 MB total (load-size budget) | 96 kbps | 10k | 4k |

If the project's `design/tech-design.md` has overrides, use those.

## Process

### Step 1 — identify the target platform

If not specified, ask the developer. If the project has multiple target platforms, default to the **tightest** budget (audit there; passing the tightest means passing the others).

### Step 2 — locate asset folders

Find the canonical asset locations:
- Unity: `Assets/` (excluding `Assets/Editor/`, `Assets/Plugins/`).
- Godot: project root for committed assets, `addons/` for plugin assets.
- Unreal: `Content/`.
- Engine-agnostic: `assets/`.

Also scan source asset locations (Aseprite, Blender, Photoshop sources):
- `games/<name>/assets/` for source files.

### Step 3 — texture audit

For each texture asset:
- **Dimensions** (width × height).
- **Format** (PNG / JPG / TGA / TIFF / engine import settings).
- **Mipmap level chain length.**
- **Compression** (None / Crunch / ASTC / DXT / BC7 / ETC2).
- **Used by N materials / sprites / UI.**
- **Estimated memory footprint at runtime** for the target platform.

Flag:
- Textures larger than the platform's max.
- Textures with no compression set.
- Textures used by only one consumer that could be merged into an atlas.
- Textures named outside the project's naming convention.

### Step 4 — atlas waste audit

For each atlas:
- **Area used** vs **total area** (packing ratio).
- **Number of sprites.**
- **Distinct dimensions** (huge variance can mean a poor packing).

Flag atlases with < 50% packing ratio — they're wasting memory. Propose splitting or repacking.

### Step 5 — audio audit

For each audio file:
- **Format** (WAV / OGG / MP3).
- **Bitrate.**
- **Channels** (mono / stereo / 5.1).
- **Sample rate** (typically 44.1 / 48 kHz; 96 kHz is suspicious for game audio).
- **Length** (some long files are misclassified — a 3-minute "SFX" is probably background music in the wrong category).

Flag:
- Bitrates above target platform max.
- Stereo files that should be mono (most SFX should be mono).
- Sample rates above 48 kHz (rarely useful in games).
- Files in raw WAV that should be Vorbis/OGG (uncompressed audio in build = bloat).

### Step 6 — mesh audit (3D projects)

For each mesh:
- **Triangle count.**
- **Vertex count.**
- **UV channels.**
- **LOD chain present?**

Flag:
- Meshes above the platform's triangle budget.
- Meshes with no LOD where the game's design implies they need one (anything seen from distance).
- Suspiciously high vertex counts relative to triangle counts (unindexed geometry).

### Step 7 — naming convention audit

Read the convention from `design/art-bible.md` if present. Otherwise propose the default:
```
{category}_{subject}_{variant}_{state}.{ext}
```

For each asset:
- Does the filename match the pattern?
- Are categories valid (a member of the open list)?
- No spaces, no uppercase outside acronyms, no double underscores.

Flag violations. Group by category for batch renames.

### Step 8 — Unity .meta sanity check

For Unity projects specifically:
- Are all `.meta` files committed? (Missing `.meta` = GUID regenerated on next import = scene references break.)
- Are any `.meta` files in `.gitignore`? (Catastrophic if yes; surface as P0.)

### Step 9 — write the audit report

To `playtest/asset-audit/<platform>-YYYY-MM-DD.md`.

## Output format

```
PLATFORM: <target>
SCAN ROOT: <path>
ASSET COUNT: <count>

TEXTURE VIOLATIONS (N findings, M GB potential savings)
  - <file>: <dim>, <format>, <compression>
    Action: <resize | recompress | atlas | merge>
  ...

ATLAS WASTE
  - <atlas>: <packing ratio>%, <unused area MB>
    Action: <repack | split | combine>

AUDIO VIOLATIONS
  - <file>: <bitrate kbps>, <channels>, <sample rate>
    Action: <re-encode | mono-down | resample>

MESH VIOLATIONS (3D only)
  - <mesh>: <triangles> tris (budget: <X>)
    Action: <decimate | add LOD | replace>

NAMING VIOLATIONS
  - <file>: <issue>
    Proposed: <new name>

CRITICAL (P0)
  - <e.g. .meta files in .gitignore>

SUMMARY
  Total size:       <MB>
  Estimated savings if all fixes applied: <MB>
  Under budget:     <yes | no, by <X> MB>

PROPOSED ACTIONS (ordered by impact)
  1. <action>: <estimated savings>
  2. ...
```

## What NOT to do

- **Don't auto-rename or auto-resize.** Asset changes touch importer settings and break references. Surface as proposals.
- **Don't audit against the most generous platform.** Always audit against the tightest target; otherwise the budget violations only surface at cert.
- **Don't ignore source assets.** A 200 MB Photoshop file in the repo bloats clone time even if it doesn't ship.
- **Don't conflate source and runtime assets.** Source files (`*.psd`, `*.blend`, `*.aseprite`) get LFS but DON'T count toward runtime budgets. Audit them separately if at all.
- **Don't recommend lossy compression on already-lossy assets.** Re-encoding a 128 kbps MP3 to 96 kbps MP3 produces audible artifacts. Audit the source format first.

## Engine-specific notes

### Unity
- Check Texture Importer settings: Crunch compression, Max Size override per platform.
- Audio Importer: Force Mono for SFX; Compression Format Vorbis for non-critical, PCM only for short transients.
- Mesh Importer: enable Optimize Mesh and Generate Lightmap UVs only when needed.

### Godot
- `.import/` is gitignored but the import metadata (`.import` file per asset) is committed. Audit those settings.
- Use `.tres` for shared resources to avoid duplication.

### Unreal
- Audit Bulk Data settings on UTextures (streaming, mip levels).
- Sound Cue settings: compression quality per Sound Class.

## Handoff

After asset-audit:
- `/perf-benchmark` — confirm asset budget changes hit the perf budget.
- [`gamestack-asset-audit`](../../bin/impl/asset-audit/README.md) CLI — automate in CI.
- `/cert-readiness` — for the platform-specific cert pass that surfaces asset-related cert issues.
