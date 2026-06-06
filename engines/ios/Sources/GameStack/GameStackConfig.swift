import Foundation

/// Runtime configuration for the gamestack loopback HTTP server.
///
/// Mirrors the role of `GameStackConfig` (Unity) and `gamestack_config.gd` (Godot):
/// declarative knobs the developer can flip at startup or via env vars. Loopback-only
/// by default so a development build can't accidentally expose its state to the
/// network.
///
/// Default port is 7333 — the next free slot after Unity (7331) and Godot (7332).
public struct GameStackConfig: Sendable {
    public var enabled: Bool
    public var port: UInt16
    public var loopbackOnly: Bool
    public var stateMaxDepth: Int
    public var screenshotScale: CGFloat
    public var screenshotFormat: ScreenshotFormat
    public var snapshotCapacity: Int

    public enum ScreenshotFormat: String, Sendable {
        case png
        case jpeg
    }

    public init(
        enabled: Bool = true,
        port: UInt16 = 7333,
        loopbackOnly: Bool = true,
        stateMaxDepth: Int = 4,
        screenshotScale: CGFloat = 1.0,
        screenshotFormat: ScreenshotFormat = .png,
        snapshotCapacity: Int = 16
    ) {
        self.enabled = enabled
        self.port = port
        self.loopbackOnly = loopbackOnly
        self.stateMaxDepth = stateMaxDepth
        self.screenshotScale = screenshotScale
        self.screenshotFormat = screenshotFormat
        self.snapshotCapacity = snapshotCapacity
    }

    /// Convenience: reads env vars for CI or scripted runs.
    /// `GAMESTACK_DISABLED=1` → enabled = false
    /// `GAMESTACK_PORT=<n>`   → port = n
    /// `GAMESTACK_LOOPBACK=0` → loopbackOnly = false (DEV ONLY; refused in release builds)
    public static func fromEnvironment(base: GameStackConfig = .init()) -> GameStackConfig {
        var cfg = base
        let env = ProcessInfo.processInfo.environment
        if env["GAMESTACK_DISABLED"] == "1" { cfg.enabled = false }
        if let raw = env["GAMESTACK_PORT"], let n = UInt16(raw) { cfg.port = n }
        #if DEBUG
        if env["GAMESTACK_LOOPBACK"] == "0" { cfg.loopbackOnly = false }
        #endif
        return cfg
    }
}
