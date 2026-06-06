# gamestack iOS sample — SpriteKit

A minimal reference for wiring gamestack into a SpriteKit game.

The file [`SampleGameStackHookup.swift`](SampleGameStackHookup.swift) shows the four hookup points every gamestack-aware iOS game needs:

1. **Start the server** in DEBUG builds (`SampleStartup.bootstrap()`).
2. **Tag state** with `@GameStackState("...")` so `/state` surfaces it.
3. **Implement `GameStackSnapshotable`** so `/snapshot` and `/restore` work for save fuzzing.
4. **Subscribe to `InputInjector`** so synthetic input from `/input` reaches your game.
5. **Wire pause/resume** in `BreakpointProvider.shared.setHandlers(...)` so `/breakpoint` can semantically pause the running game.

## Test it

After adding GameStack to your project (Swift Package Manager via the gamestack repo's `engines/ios` path), drop in `SampleScene` as your initial scene. Run in Simulator.

Then from your dev machine:

```bash
curl http://127.0.0.1:7333/health
curl http://127.0.0.1:7333/state | jq .
curl -X POST http://127.0.0.1:7333/screenshot -o frame.png
curl -X POST http://127.0.0.1:7333/snapshot -d '{"id":"before-boss"}'
curl http://127.0.0.1:7333/snapshots
curl -X POST http://127.0.0.1:7333/restore -d '{"id":"before-boss"}'
curl -X POST http://127.0.0.1:7333/input \
  -H 'content-type: application/json' \
  -d '{"events":[{"type":"tap","action":"jump","positionX":100,"positionY":200,"timestamp":0}]}'
```

That's the same contract Unity (port 7331) and Godot (port 7332) expose. Any `/playtest` scenario built against the engine SDK contract runs against this sample with `--engine=ios` (default port 7333).

## What's not included

- A full Xcode project. The sample lives as plain Swift files so it compiles in any host app. Wrap it in your project's `App` / `AppDelegate` per your normal setup.
- `Info.plist` privacy declarations for screenshot capture. In production builds gamestack should not be started, so no plist entry is required. If you do enable it in TestFlight builds, add `NSPhotoLibraryUsageDescription` only if you're exporting screenshots outside the loopback HTTP response.
