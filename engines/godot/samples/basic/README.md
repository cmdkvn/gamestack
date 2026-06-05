# gamestack — Basic sample (Godot)

Minimal end-to-end wiring of the four interactive endpoints introduced alongside the Godot SDK v0.2.0:

- `POST /input` — subscribe to `GameStack.input_injector.on_input`.
- `POST /snapshot` and `POST /restore` — implement the four duck-typed methods (`_gamestack_snapshot_key`, `_gamestack_capture_snapshot`, `_gamestack_restore_snapshot`) plus register with `GameStack.register_snapshotable(self)`.
- `POST /breakpoint` — call `GameStack.hit("tag")` at semantic checkpoints.
- `GET /state` — register values via `GameStack.expose(self, "key", "namespace", callable)`.

## How to use the sample

1. Enable the gamestack plugin: Project > Project Settings > Plugins > gamestack > Enable.
2. Create a new scene (any root Node).
3. Drop a Node into the scene and attach `sample_gamestack_hookup.gd` (this file's sibling).
4. Press Play.
5. From a terminal:

   ```bash
   # Inject input
   curl -X POST http://localhost:7332/input \
     -H 'Content-Type: application/json' \
     -d '{"events":[{"device":"Keyboard","action":"Press","control":"Space"}]}'

   # Read state — sample.buttonPresses should be 1
   curl http://localhost:7332/state

   # Capture a snapshot
   curl -X POST http://localhost:7332/snapshot

   # Pause on the next "input.Space" hit
   curl -X POST http://localhost:7332/breakpoint \
     -H 'Content-Type: application/json' \
     -d '{"action":"add-pause","tag":"input.Space"}'

   # Resume
   curl -X POST http://localhost:7332/breakpoint \
     -H 'Content-Type: application/json' \
     -d '{"action":"resume"}'
   ```

## Customizing the sample for your game

The single file demonstrates each integration point. You'll write your own input adapter, state exposes, and snapshotable nodes matching your game's mechanics. Patterns transfer directly from the Unity SDK's Basic sample.
