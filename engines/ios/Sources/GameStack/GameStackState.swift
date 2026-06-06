import Foundation

/// Property wrapper marking a stored value as part of the game state visible
/// via `GET /state`. Mirror of Unity's `[GameStackState]` attribute and
/// Godot's `tagged.*` dictionary.
///
/// Usage:
/// ```swift
/// final class Player {
///     @GameStackState("hp") var hp: Int = 100
///     @GameStackState("name") var name: String = "Unnamed"
/// }
/// ```
///
/// Tagged values are registered with a global registry the StateProvider walks
/// on every `/state` request. The wrapper holds the value; the registry holds
/// only weak references to the owning object plus a closure that reads the
/// current value. When the owning object deallocates, the registry skips it.
@propertyWrapper
public final class GameStackState<Value> {
    private let key: String
    private var value: Value
    private let registration: GameStackStateRegistration

    public var wrappedValue: Value {
        get { value }
        set {
            value = newValue
            registration.touch()
        }
    }

    public init(wrappedValue: Value, _ key: String) {
        self.key = key
        self.value = wrappedValue
        let initial = wrappedValue
        var captured = initial
        self.registration = GameStackStateRegistration(
            key: key,
            read: { captured }
        )
        // Keep the read closure pointed at the latest value via a thin update.
        self.registration.update = { [weak self] in
            captured = self?.value ?? initial
        }
        GameStackStateRegistry.shared.register(registration)
    }

    deinit {
        GameStackStateRegistry.shared.unregister(registration)
    }
}

final class GameStackStateRegistration: Identifiable, @unchecked Sendable {
    let id = UUID()
    let key: String
    let read: () -> Any
    var update: () -> Void = {}

    init(key: String, read: @escaping () -> Any) {
        self.key = key
        self.read = read
    }

    func touch() {
        update()
    }
}

/// Global registry of `@GameStackState`-tagged values.
/// Thread-safe (read path is hot; write path runs at registration time).
final class GameStackStateRegistry: @unchecked Sendable {
    static let shared = GameStackStateRegistry()

    private let lock = NSLock()
    private var registrations: [UUID: GameStackStateRegistration] = [:]

    func register(_ r: GameStackStateRegistration) {
        lock.lock(); defer { lock.unlock() }
        registrations[r.id] = r
    }

    func unregister(_ r: GameStackStateRegistration) {
        lock.lock(); defer { lock.unlock() }
        registrations.removeValue(forKey: r.id)
    }

    func snapshot() -> [String: Any] {
        lock.lock()
        let regs = Array(registrations.values)
        lock.unlock()
        var out: [String: Any] = [:]
        for r in regs {
            r.touch()
            out[r.key] = JSONFriendly.convert(r.read())
        }
        return out
    }
}

/// Coerces arbitrary Swift values into JSON-friendly representations so the
/// state endpoint can serialize them without the developer manually conforming
/// every state type to Encodable.
enum JSONFriendly {
    static func convert(_ value: Any) -> Any {
        switch value {
        case let v as Int: return v
        case let v as Int32: return Int(v)
        case let v as Int64: return Int(v)
        case let v as UInt: return v
        case let v as UInt32: return Int(v)
        case let v as Double: return v
        case let v as Float: return Double(v)
        case let v as CGFloat: return Double(v)
        case let v as Bool: return v
        case let v as String: return v
        case let v as [Any]: return v.map(convert)
        case let v as [String: Any]: return v.mapValues(convert)
        case let v as Date: return ISO8601DateFormatter().string(from: v)
        case let v as URL: return v.absoluteString
        case let v as RawRepresentable: return convert(v.rawValue)
        default:
            return String(describing: value)
        }
    }
}
