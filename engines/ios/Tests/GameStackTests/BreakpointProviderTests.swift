import XCTest
@testable import GameStack

final class BreakpointProviderTests: XCTestCase {
    func testHitWithMatchingTagInvokesPauseHandler() {
        let provider = BreakpointProvider.shared
        provider.setPauseTags([])  // reset
        var paused = 0
        var resumed = 0
        provider.setHandlers(
            pause: { paused += 1 },
            resume: { resumed += 1 })

        provider.setPauseTags(["boss-room"])
        let didPause = provider.hit(tag: "boss-room")
        XCTAssertTrue(didPause)
        XCTAssertEqual(paused, 1)
        XCTAssertEqual(resumed, 0)

        provider.resume()
        XCTAssertEqual(resumed, 1)
    }

    func testHitWithNonMatchingTagDoesNotPause() {
        let provider = BreakpointProvider.shared
        provider.setPauseTags(["other"])
        var paused = 0
        provider.setHandlers(pause: { paused += 1 }, resume: {})
        let didPause = provider.hit(tag: "checkpoint")
        XCTAssertFalse(didPause)
        XCTAssertEqual(paused, 0)
    }

    func testRecentHitsAreRecordedAndBounded() {
        let provider = BreakpointProvider.shared
        provider.setPauseTags([])
        provider.setHandlers(pause: {}, resume: {})
        for i in 0..<40 {
            _ = provider.hit(tag: "tag-\(i)")
        }
        let recent = provider.recentHits()
        XCTAssertLessThanOrEqual(recent.count, 8)
        XCTAssertTrue(recent.contains(where: { ($0["tag"] as? String) == "tag-39" }))
    }
}
