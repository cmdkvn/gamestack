import XCTest
@testable import GameStack

final class SnapshotProviderTests: XCTestCase {
    @MainActor
    func testCaptureRestoreRoundtrip() {
        let provider = SnapshotProvider.shared
        provider.setCapacity(8)
        let world = TestWorld()
        provider.register(world)
        defer { provider.unregister(world) }

        world.score = 100
        world.name = "level-1"
        let id1 = provider.capture(id: "before-boss")

        world.score = 0
        world.name = "game-over"

        let ok = provider.restore(id: id1)
        XCTAssertTrue(ok)
        XCTAssertEqual(world.score, 100)
        XCTAssertEqual(world.name, "level-1")
    }

    @MainActor
    func testListReportsAllStoredIds() {
        let provider = SnapshotProvider.shared
        provider.setCapacity(8)
        let world = TestWorld()
        provider.register(world)
        defer { provider.unregister(world) }

        _ = provider.capture(id: "alpha")
        _ = provider.capture(id: "beta")
        _ = provider.capture(id: "gamma")
        let list = provider.list()
        XCTAssertTrue(list.contains("alpha"))
        XCTAssertTrue(list.contains("beta"))
        XCTAssertTrue(list.contains("gamma"))
    }

    @MainActor
    func testRestoreUnknownIdReturnsFalse() {
        let provider = SnapshotProvider.shared
        XCTAssertFalse(provider.restore(id: "does-not-exist"))
    }

    @MainActor
    func testCapacityTrimsOldestEntries() {
        let provider = SnapshotProvider.shared
        provider.setCapacity(2)
        let world = TestWorld()
        provider.register(world)
        defer { provider.unregister(world) }

        _ = provider.capture(id: "a")
        _ = provider.capture(id: "b")
        _ = provider.capture(id: "c")  // pushes "a" out
        let list = provider.list()
        XCTAssertFalse(list.contains("a"))
        XCTAssertTrue(list.contains("b"))
        XCTAssertTrue(list.contains("c"))
    }

    private final class TestWorld: GameStackSnapshotable {
        var snapshotKey: String { "world" }
        var score: Int = 0
        var name: String = ""
        func captureSnapshot() -> [String: Any] {
            ["score": score, "name": name]
        }
        func restoreSnapshot(_ payload: [String: Any]) {
            if let s = payload["score"] as? Int { score = s }
            if let n = payload["name"] as? String { name = n }
        }
    }
}
