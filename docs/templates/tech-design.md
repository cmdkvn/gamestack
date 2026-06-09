<!--
artifact: tech-design
authored_by: developer
audited_by: plan-tech-design
schema_version: 1
when_written: "Before /plan-tech-design audits it. Authored by the developer."
-->

# {{game name}} — Tech Design

## Engine and version

<!-- /plan-tech-design requires a specific version, not just an engine name.
     "Unity" will ship into an engine update mid-production and lose a week.
     "Godot" without 3 vs 4 lands in a different language ecosystem. -->

**Engine:** {{e.g., Unity | Godot | Unreal | other}}

**Version:** {{e.g., "Unity 6.0.4" — exact version, not a range}}

**Expected breaking-change risks:** {{describe known risks between current version and anticipated ship-time version, or "none identified"}}

## State machines

<!-- /plan-tech-design expects an ASCII diagram (or equivalent) for each state machine listed below.
     For any missing, /plan-tech-design will generate a first-draft diagram and propose it.
     Fill in what you know; leave blank and note "not yet designed" where you don't. -->

### Player state

<!-- idle → moving → jumping → falling → landing → … (game-specific) -->

```
{{ASCII diagram or "not yet designed"}}
```

### Enemy / NPC AI

<!-- patrol → alert → engage → recover → die (game-specific) -->

```
{{ASCII diagram or "not yet designed"}}
```

### Dialog system

<!-- ready → presenting → awaiting input → branching → exiting -->

```
{{ASCII diagram or "not yet designed — N/A if no dialog system"}}
```

### Save state

<!-- transitions between save points; what happens to in-flight state -->

```
{{ASCII diagram or "not yet designed"}}
```

### Game state

<!-- title → menu → playing → paused → game-over → … -->

```
{{ASCII diagram or "not yet designed"}}
```

## Data flow

<!-- Trace the critical path end to end.
     /plan-tech-design checks each arrow for: main-thread/worker boundary safety, per-frame allocation, singletons (a coupling smell). -->

```
Input device → Input abstraction → Game state mutation → Render pipeline → Frame output
                                          ↓
                                   Audio engine → Output
```

**Actual path for this game:**
{{describe what data crosses each arrow, on what thread, with what frequency — or note gaps}}

**Known concerns:**
- {{e.g., "pathfinding crosses main thread" | "per-frame allocation in X system" | "singleton at Y"}}

## Frame budget

<!-- /plan-tech-design will propose defaults and flag the need to validate early if this is missing.
     "We'll optimize later" is not a frame budget. -->

**Per-platform targets:**

| Platform | Target FPS | Frame budget (ms) |
|---|---|---|
| {{e.g., PC (mid-range GPU)}} | {{e.g., 60}} | {{e.g., 16.67}} |
| {{e.g., Switch (handheld)}} | {{e.g., 30}} | {{e.g., 33.33}} |

**Budget split within each frame:**
<!-- Propose a split across rendering, physics, AI, scripting, garbage collection. -->
- Rendering: {{ms or %}}
- Physics: {{ms or %}}
- AI: {{ms or %}}
- Scripting: {{ms or %}}
- Garbage collection: {{ms or %}}

## Save format

<!-- Saves are a cert-blocker on all three consoles and a primary source of player rage.
     /plan-tech-design checks all four items; missing any is a top finding. -->

**Format:** {{JSON | MessagePack | engine-native | binary custom | not yet decided}}

**Version field:** {{yes — field name: "{{name}}" | no — must add}}

**Migration policy** (what happens to a v1 save loaded in v2): {{migration | rejection | best-effort | not yet decided}}

**Atomic writes** (temp file + rename to survive power loss): {{yes | no — must add}}

## Asset pipeline

<!-- Trace source → import → atlas → runtime.
     /plan-tech-design checks naming conventions, atlas strategy, per-platform compression, and source-asset VCS. -->

**Source-to-runtime path:**
```
Source ({{e.g., Aseprite / Blender / Photoshop}}) → Engine import (.meta / .import) → Atlas / mip / compression → Runtime
```

**Naming convention:** {{kebab-case | camelCase | snake_case | other — be specific about consistency}}

**Atlas strategy:** {{e.g., "per-region atlasing with trim & rotate" | "single atlas per scene" | not yet decided}}

**Per-platform compression:**
| Platform | Compression format |
|---|---|
| Android | {{e.g., ETC2}} |
| iOS / mobile high-end | {{e.g., ASTC}} |
| Desktop | {{e.g., BC7 / DXT5 fallback}} |
| Console | {{}} |

**Source-asset version control:** {{LFS | external DAM | committed as binary | not yet decided}}

## Cross-platform abstraction

<!-- Anything platform-specific not behind an abstraction is a refactor waiting to happen the day a new platform is added.
     /plan-tech-design checks each concern listed here. Mark N/A only if the concern genuinely doesn't apply. -->

| Concern | Abstracted? | Notes |
|---|---|---|
| Input (keyboard / mouse / gamepad / touch) | {{yes — single input action map | no | N/A}} | {{}} |
| Save data location | {{yes — Application.persistentDataPath-style | no | N/A}} | {{}} |
| Achievements / trophies | {{yes — abstract service interface | no | N/A}} | {{}} |
| Networking | {{yes | no | N/A}} | {{}} |
| IAP / store | {{yes | no | N/A}} | {{}} |

## Test strategy

<!-- /plan-tech-design surfaces a missing test strategy as a risk: first regression ships a week before launch.
     Answer each line. -->

- **Engine play-mode tests** for game logic: {{yes | planned | no}}
- **Unit tests** on pure-logic code (combat math, save serialization, state transitions): {{yes | planned | no}}
- **Integration tests** via /playtest (M2): {{yes | planned | no}}
- **Test data fixtures** versioned with the code: {{yes | planned | no}}

## Console-specific requirements

<!-- /plan-tech-design checks each console if it appears in the target platforms above.
     "We'll handle that at cert" is not acceptable — these affect save system and input architecture. -->

| Platform | Concern | Covered? |
|---|---|---|
| Switch | Handheld vs docked input + perf; suspend/resume; parental controls; controller modes | {{yes | gap | N/A}} |
| PS5 | DualSense haptic + adaptive triggers; PSN trophies; Quick Resume-like flows | {{yes | gap | N/A}} |
| Xbox | Achievements; Quick Resume (arbitrary state restore); cloud saves; profile switch | {{yes | gap | N/A}} |
