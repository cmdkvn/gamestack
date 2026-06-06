import XCTest
@testable import GameStack

final class InputInjectorTests: XCTestCase {
    func testDispatchDeliversToSubscribers() {
        var received: [InputEvent] = []
        let token = InputInjector.shared.subscribe { received.append($0) }
        defer { _ = token }  // keep alive

        let count = InputInjector.shared.dispatchBatch(.init(events: [
            .init(type: "tap", action: "jump", positionX: 100, positionY: 200, value: nil),
            .init(type: "drag", action: nil, positionX: 110, positionY: 210, value: nil),
        ]))

        XCTAssertEqual(count, 2)
        XCTAssertEqual(received.count, 2)
        XCTAssertEqual(received.first?.action, "jump")
    }

    func testUnsubscribeStopsDelivery() {
        var received: [InputEvent] = []
        do {
            let token = InputInjector.shared.subscribe { received.append($0) }
            _ = token
        }
        // Token released → subscription should be removed.
        _ = InputInjector.shared.dispatchBatch(.init(events: [
            .init(type: "tap", action: "noop"),
        ]))
        XCTAssertTrue(received.isEmpty, "after deinit the subscription should be removed")
    }

    func testInputEventCodableRoundtrip() throws {
        let event = InputEvent(
            type: "tap",
            action: "jump",
            positionX: 100,
            positionY: 200,
            value: 0.85,
            metadata: ["source": "test"])
        let encoded = try JSONEncoder().encode(event)
        let decoded = try JSONDecoder().decode(InputEvent.self, from: encoded)
        XCTAssertEqual(decoded.type, "tap")
        XCTAssertEqual(decoded.action, "jump")
        XCTAssertEqual(decoded.value, 0.85)
        XCTAssertEqual(decoded.metadata?["source"], "test")
    }
}
