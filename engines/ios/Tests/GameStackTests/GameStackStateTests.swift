import XCTest
@testable import GameStack

final class GameStackStateTests: XCTestCase {
    func testRegistersAndUnregistersOnDeinit() {
        let baseline = GameStackStateRegistry.shared.snapshot().count
        do {
            let owner = Player(hp: 100, name: "Anonymous")
            _ = owner.hp  // ensure the wrapper is materialized
            let registered = GameStackStateRegistry.shared.snapshot()
            XCTAssertEqual(registered["player.hp"] as? Int, 100)
            XCTAssertEqual(registered["player.name"] as? String, "Anonymous")
            XCTAssertGreaterThan(registered.count, baseline)
        }
        // Owner is out of scope — the property-wrapper instances live as
        // long as the owner. Reflect a clean unregister.
        let after = GameStackStateRegistry.shared.snapshot()
        XCTAssertNil(after["player.hp"])
        XCTAssertNil(after["player.name"])
    }

    func testReflectsValueUpdates() {
        let owner = Player(hp: 100, name: "Anonymous")
        owner.hp = 42
        owner.name = "Marin"
        let snap = GameStackStateRegistry.shared.snapshot()
        XCTAssertEqual(snap["player.hp"] as? Int, 42)
        XCTAssertEqual(snap["player.name"] as? String, "Marin")
    }

    func testJSONFriendlyCoercesCommonTypes() {
        XCTAssertEqual(JSONFriendly.convert(42) as? Int, 42)
        XCTAssertEqual(JSONFriendly.convert(3.14) as? Double, 3.14)
        XCTAssertEqual(JSONFriendly.convert(true) as? Bool, true)
        XCTAssertEqual(JSONFriendly.convert("hello") as? String, "hello")
        XCTAssertEqual(JSONFriendly.convert([1, 2, 3]) as? [Int], [1, 2, 3])
        XCTAssertEqual(JSONFriendly.convert(URL(string: "https://example.com")!) as? String,
                       "https://example.com")
    }

    private final class Player {
        @GameStackState("player.hp") var hp: Int
        @GameStackState("player.name") var name: String
        init(hp: Int, name: String) {
            self.hp = hp
            self.name = name
        }
    }
}
