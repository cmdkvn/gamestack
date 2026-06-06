import Foundation

/// Receives synthesized input events from `POST /input` and dispatches them to
/// subscribers. Mirror of Unity's `InputInjector.OnInput` and Godot's
/// `gamestack_input` autoload.
///
/// iOS doesn't allow synthesizing native UIEvent / UITouch into the system
/// event queue from outside the system framework (it's an App Store rejection
/// risk), so this provider takes a *subscription* model: SpriteKit scenes,
/// SwiftUI views, or game-state machines subscribe via `subscribe(...)` and
/// react to InputEvent dispatches in their own input layer. The developer
/// wires it the way they wire any other event channel in their game.
public struct InputEvent: Codable, Sendable {
    public let type: String              // "tap", "drag", "swipe", "button", "key", "custom"
    public let action: String?           // game-specific: "jump", "shoot", etc.
    public let positionX: Double?
    public let positionY: Double?
    public let value: Double?            // axis value, drag delta, button pressure
    public let metadata: [String: String]?
    public let timestamp: TimeInterval

    public init(type: String,
                action: String? = nil,
                positionX: Double? = nil,
                positionY: Double? = nil,
                value: Double? = nil,
                metadata: [String: String]? = nil,
                timestamp: TimeInterval = Date().timeIntervalSince1970) {
        self.type = type
        self.action = action
        self.positionX = positionX
        self.positionY = positionY
        self.value = value
        self.metadata = metadata
        self.timestamp = timestamp
    }
}

public struct InputEventBatch: Codable, Sendable {
    public let events: [InputEvent]
}

public final class InputInjector: @unchecked Sendable {
    public static let shared = InputInjector()
    private init() {}

    public typealias Listener = @Sendable (InputEvent) -> Void

    private let lock = NSLock()
    private var subscribers: [UUID: Listener] = [:]

    @discardableResult
    public func subscribe(_ listener: @escaping Listener) -> SubscriptionToken {
        lock.lock(); defer { lock.unlock() }
        let id = UUID()
        subscribers[id] = listener
        return SubscriptionToken(id: id, injector: self)
    }

    func unsubscribe(_ id: UUID) {
        lock.lock(); defer { lock.unlock() }
        subscribers.removeValue(forKey: id)
    }

    func dispatch(_ event: InputEvent) {
        lock.lock()
        let listeners = Array(subscribers.values)
        lock.unlock()
        for l in listeners {
            l(event)
        }
    }

    func dispatchBatch(_ batch: InputEventBatch) -> Int {
        for e in batch.events { dispatch(e) }
        return batch.events.count
    }

    public final class SubscriptionToken {
        let id: UUID
        private weak var injector: InputInjector?
        init(id: UUID, injector: InputInjector) { self.id = id; self.injector = injector }
        deinit { injector?.unsubscribe(id) }
    }
}
