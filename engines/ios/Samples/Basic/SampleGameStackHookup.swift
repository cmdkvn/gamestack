import Foundation
import SpriteKit
import GameStack

/// Sample: hook gamestack into a SpriteKit scene. Compile-checked here as
/// reference code; drop into your own SpriteKit project to start using it.
///
/// What this demonstrates:
/// 1. Starting the server in DEBUG builds.
/// 2. Tagging state with @GameStackState so /state surfaces it.
/// 3. Subscribing to /input dispatches.
/// 4. Conforming to GameStackSnapshotable for /snapshot + /restore.
/// 5. Calling BreakpointProvider.hit at semantic checkpoints.
final class SampleScene: SKScene, GameStackSnapshotable {
    @GameStackState("scene.score") private var score: Int = 0
    @GameStackState("scene.name") private var sceneName: String = "level-1"
    @GameStackState("player.hp") private var playerHP: Int = 100

    private var inputToken: InputInjector.SubscriptionToken?

    override func didMove(to view: SKView) {
        super.didMove(to: view)

        // 1. Register with snapshot provider.
        SnapshotProvider.shared.register(self)

        // 2. Wire pause / resume handlers for breakpoints.
        BreakpointProvider.shared.setHandlers(
            pause: { [weak self] in
                self?.isPaused = true
            },
            resume: { [weak self] in
                self?.isPaused = false
            })

        // 3. Subscribe to injected input.
        inputToken = InputInjector.shared.subscribe { [weak self] event in
            self?.handle(event: event)
        }
    }

    override func willMove(from view: SKView) {
        super.willMove(from: view)
        inputToken = nil
        SnapshotProvider.shared.unregister(self)
    }

    private func handle(event: InputEvent) {
        switch event.action ?? event.type {
        case "jump":
            // Player jumped via /input — same path as a touch handler.
            playerHP -= 1
        case "checkpoint":
            // Synthetic checkpoint trigger.
            _ = BreakpointProvider.shared.hit(tag: "checkpoint-hit")
        default:
            break
        }
    }

    // MARK: - GameStackSnapshotable

    var snapshotKey: String { "sample-scene" }

    func captureSnapshot() -> [String: Any] {
        [
            "score": score,
            "sceneName": sceneName,
            "playerHP": playerHP,
        ]
    }

    func restoreSnapshot(_ payload: [String: Any]) {
        if let v = payload["score"] as? Int { score = v }
        if let v = payload["sceneName"] as? String { sceneName = v }
        if let v = payload["playerHP"] as? Int { playerHP = v }
    }
}

/// Sample AppDelegate-style startup. In a SwiftUI app, do this in App.init.
enum SampleStartup {
    static func bootstrap() {
        #if DEBUG
        // Defaults are sensible (loopback only, port 7333, screenshot enabled).
        // Pass a custom config if you need to change ports or scaling.
        GameStack.shared.start()
        #endif
    }
}
