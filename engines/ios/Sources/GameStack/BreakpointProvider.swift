import Foundation

/// Tag-based pause control for the running game. `POST /breakpoint` is the
/// canonical way `/playtest` semantic checkpoints fire; the developer's code
/// calls `BreakpointProvider.shared.hit(tag:)` at meaningful points and the
/// server can configure which tags pause.
public final class BreakpointProvider: @unchecked Sendable {
    public static let shared = BreakpointProvider()
    private init() {}

    private let lock = NSLock()
    private var pauseTags: Set<String> = []
    private var lastHits: [(tag: String, at: Date)] = []
    private var pauseHandler: (@Sendable () -> Void)?
    private var resumeHandler: (@Sendable () -> Void)?

    /// Set the handlers your game uses for pause / resume (e.g. SpriteKit's
    /// `scene.isPaused = true`). gamestack invokes them when a tagged hit
    /// matches the active pause filter.
    public func setHandlers(pause: @escaping @Sendable () -> Void,
                            resume: @escaping @Sendable () -> Void) {
        lock.lock(); defer { lock.unlock() }
        self.pauseHandler = pause
        self.resumeHandler = resume
    }

    /// Game code calls this at semantic checkpoints. Returns whether the
    /// engine was paused as a result.
    @discardableResult
    public func hit(tag: String, metadata: [String: String] = [:]) -> Bool {
        lock.lock()
        lastHits.append((tag, Date()))
        if lastHits.count > 32 { lastHits.removeFirst() }
        let shouldPause = pauseTags.contains(tag)
        let pauseHandler = self.pauseHandler
        lock.unlock()
        if shouldPause {
            pauseHandler?()
            return true
        }
        return false
    }

    func setPauseTags(_ tags: [String]) {
        lock.lock(); defer { lock.unlock() }
        pauseTags = Set(tags)
    }

    func resume() {
        let handler: (@Sendable () -> Void)?
        lock.lock(); handler = resumeHandler; lock.unlock()
        handler?()
    }

    func recentHits() -> [[String: Any]] {
        lock.lock(); defer { lock.unlock() }
        let formatter = ISO8601DateFormatter()
        return lastHits.suffix(8).map { hit in
            ["tag": hit.tag, "at": formatter.string(from: hit.at)]
        }
    }
}
