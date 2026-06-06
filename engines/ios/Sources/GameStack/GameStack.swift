import Foundation
#if canImport(UIKit)
import UIKit
#endif

/// Public entry point for the gamestack iOS SDK.
///
/// Usage:
/// ```swift
/// // SwiftUI App
/// @main
/// struct MyApp: App {
///     init() {
///         #if DEBUG
///         GameStack.shared.start()
///         #endif
///     }
///     var body: some Scene { ... }
/// }
/// ```
///
/// Or with custom configuration:
/// ```swift
/// var config = GameStackConfig()
/// config.port = 7333
/// config.stateMaxDepth = 6
/// GameStack.shared.start(with: config)
/// ```
///
/// Loopback-only by default. Refuses to start in release builds unless the
/// developer explicitly sets `loopbackOnly = false` and the build was compiled
/// with `#if DEBUG`. The server should not ship to production.
public final class GameStack: @unchecked Sendable {
    public static let shared = GameStack()

    public private(set) var isRunning: Bool = false
    public private(set) var endpoint: String = ""
    public private(set) var status: String = "Stopped"

    private var server: HTTPServer?
    private var config: GameStackConfig = .init()
    private let lifecycleLock = NSLock()

    private init() {}

    /// Start the server. Idempotent — calling start() twice without a stop
    /// is a no-op (logs a warning).
    public func start(with overrideConfig: GameStackConfig? = nil) {
        lifecycleLock.lock(); defer { lifecycleLock.unlock() }
        if isRunning {
            log("[gamestack] already running on \(endpoint)")
            return
        }
        let cfg = overrideConfig ?? GameStackConfig.fromEnvironment()
        self.config = cfg

        guard cfg.enabled else {
            self.status = "Disabled in config"
            log("[gamestack] disabled in config; server not started")
            return
        }

        #if !DEBUG
        guard cfg.loopbackOnly else {
            self.status = "Refused: non-loopback bind in release build"
            log("[gamestack] refusing to start: non-loopback bind is DEBUG-only")
            return
        }
        #endif

        SnapshotProvider.shared.setCapacity(cfg.snapshotCapacity)

        let server = HTTPServer(port: cfg.port, loopbackOnly: cfg.loopbackOnly) { request in
            await Endpoints.dispatch(request, config: cfg)
        }
        do {
            try server.start()
            self.server = server
            self.isRunning = true
            self.endpoint = "http://127.0.0.1:\(cfg.port)/"
            self.status = "Running on \(endpoint)"
            log("[gamestack] server started on \(endpoint) (loopback=\(cfg.loopbackOnly))")
        } catch {
            self.status = "Failed: \(error)"
            log("[gamestack] failed to start: \(error)")
        }
    }

    /// Stop the server. Releases the listener and closes all open connections.
    public func stop() {
        lifecycleLock.lock(); defer { lifecycleLock.unlock() }
        server?.stop()
        server = nil
        isRunning = false
        status = "Stopped"
        endpoint = ""
        log("[gamestack] server stopped")
    }

    private func log(_ message: String) {
        // Print is the right call for a dev-time debug server. NSLog spams the
        // OS log; os_log is fine but adds a Subsystem boilerplate dance.
        print(message)
    }
}
