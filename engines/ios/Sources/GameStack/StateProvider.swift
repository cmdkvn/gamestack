import Foundation
#if canImport(UIKit)
import UIKit
#endif

/// Builds the JSON-serializable game-state snapshot returned by `GET /state`.
///
/// Always called on the main thread (uses UIKit + ProcessInfo APIs).
@MainActor
enum StateProvider {
    static func collect(config: GameStackConfig) -> [String: Any] {
        var state: [String: Any] = [
            "platform": "ios",
            "iosVersion": ProcessInfo.processInfo.operatingSystemVersionString,
            "thermalState": thermalStateString(),
            "isLowPowerModeEnabled": ProcessInfo.processInfo.isLowPowerModeEnabled,
            "processorCount": ProcessInfo.processInfo.processorCount,
            "physicalMemoryMB": ProcessInfo.processInfo.physicalMemory / (1024 * 1024),
            "uptimeSeconds": ProcessInfo.processInfo.systemUptime,
        ]

        #if canImport(UIKit)
        if let app = uiApplicationIfAvailable() {
            state["applicationState"] = applicationStateString(app.applicationState)
        }
        if let window = uiKeyWindowIfAvailable() {
            state["windowSize"] = ["width": window.bounds.width, "height": window.bounds.height]
            state["screenScale"] = window.screen.scale
        }
        #endif

        state["tagged"] = GameStackStateRegistry.shared.snapshot()
        return state
    }

    private static func thermalStateString() -> String {
        switch ProcessInfo.processInfo.thermalState {
        case .nominal: return "nominal"
        case .fair:    return "fair"
        case .serious: return "serious"
        case .critical: return "critical"
        @unknown default: return "unknown"
        }
    }

    #if canImport(UIKit)
    private static func uiApplicationIfAvailable() -> UIApplication? {
        // UIApplication.shared is unavailable in app extensions; guard accordingly.
        if Bundle.main.bundlePath.hasSuffix(".appex") { return nil }
        return UIApplication.shared
    }

    private static func uiKeyWindowIfAvailable() -> UIWindow? {
        guard let app = uiApplicationIfAvailable() else { return nil }
        for scene in app.connectedScenes {
            guard let ws = scene as? UIWindowScene else { continue }
            if let key = ws.windows.first(where: { $0.isKeyWindow }) {
                return key
            }
            if let first = ws.windows.first {
                return first
            }
        }
        return nil
    }

    private static func applicationStateString(_ s: UIApplication.State) -> String {
        switch s {
        case .active: return "active"
        case .inactive: return "inactive"
        case .background: return "background"
        @unknown default: return "unknown"
        }
    }
    #endif
}
