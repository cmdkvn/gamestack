import Foundation

/// Conforming types provide an opaque blob the snapshot endpoint serializes
/// into the in-memory snapshot store. `RestoreSnapshot` is invoked on the
/// main actor when `POST /restore` fires.
public protocol GameStackSnapshotable: AnyObject {
    /// Stable identifier (e.g. "Player", "World"). Used as the dictionary key
    /// inside the snapshot JSON.
    var snapshotKey: String { get }

    /// Capture the current state into a JSON-friendly dictionary.
    @MainActor
    func captureSnapshot() -> [String: Any]

    /// Restore the state from a previously captured payload.
    @MainActor
    func restoreSnapshot(_ payload: [String: Any])
}

/// In-memory snapshot store. Bounded to `capacity` — drops oldest on overflow.
public final class SnapshotProvider: @unchecked Sendable {
    public static let shared = SnapshotProvider()
    private init() {}

    private let lock = NSLock()
    private var snapshots: [(id: String, payload: [String: Any], at: Date)] = []
    private var capacity: Int = 16
    private var registered: [ObjectIdentifier: WeakBox] = [:]

    public func setCapacity(_ capacity: Int) {
        lock.lock(); defer { lock.unlock() }
        self.capacity = max(1, capacity)
        trim()
    }

    public func register(_ snapshotable: GameStackSnapshotable) {
        lock.lock(); defer { lock.unlock() }
        registered[ObjectIdentifier(snapshotable)] = WeakBox(value: snapshotable)
    }

    public func unregister(_ snapshotable: GameStackSnapshotable) {
        lock.lock(); defer { lock.unlock() }
        registered.removeValue(forKey: ObjectIdentifier(snapshotable))
    }

    /// Capture a snapshot from every registered Snapshotable. Returns the id.
    @MainActor
    func capture(id: String?) -> String {
        let resolvedId = id ?? "snap-\(Int(Date().timeIntervalSince1970 * 1000))"
        var payload: [String: Any] = [
            "_meta": [
                "id": resolvedId,
                "capturedAt": ISO8601DateFormatter().string(from: Date()),
            ],
            "tagged": GameStackStateRegistry.shared.snapshot(),
        ]
        let snaps = liveSnapshotables()
        var bag: [String: Any] = [:]
        for s in snaps {
            bag[s.snapshotKey] = s.captureSnapshot()
        }
        payload["snapshotables"] = bag

        lock.lock()
        snapshots.append((resolvedId, payload, Date()))
        trim()
        lock.unlock()
        return resolvedId
    }

    func list() -> [String] {
        lock.lock(); defer { lock.unlock() }
        return snapshots.map(\.id)
    }

    @MainActor
    func restore(id: String) -> Bool {
        lock.lock()
        let match = snapshots.first(where: { $0.id == id })
        lock.unlock()
        guard let match = match else { return false }
        let bag = (match.payload["snapshotables"] as? [String: Any]) ?? [:]
        for s in liveSnapshotables() {
            if let payload = bag[s.snapshotKey] as? [String: Any] {
                s.restoreSnapshot(payload)
            }
        }
        return true
    }

    private func liveSnapshotables() -> [GameStackSnapshotable] {
        lock.lock(); defer { lock.unlock() }
        return registered.values.compactMap { $0.value as? GameStackSnapshotable }
    }

    private func trim() {
        // Caller holds lock.
        while snapshots.count > capacity {
            snapshots.removeFirst()
        }
    }
}

private final class WeakBox {
    weak var value: AnyObject?
    init(value: AnyObject) { self.value = value }
}
