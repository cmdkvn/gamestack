import Foundation

/// Routes incoming HTTP requests to the right provider. Centralized so the
/// route table is easy to read and the server stays generic.
@MainActor
enum Endpoints {
    static func dispatch(_ request: HTTPRequest, config: GameStackConfig) async -> HTTPResponse {
        switch (request.method, request.path) {
        case ("GET", "/health"):
            return HTTPResponse.json([
                "ok": true,
                "engine": "ios",
                "endpoints": [
                    "/health", "/state", "/screenshot",
                    "/input", "/snapshot", "/restore", "/snapshots",
                    "/breakpoint",
                ],
            ])

        case ("GET", "/state"):
            return HTTPResponse.json(StateProvider.collect(config: config))

        case ("POST", "/screenshot"):
            do {
                let data = try ScreenshotProvider.capture(
                    format: config.screenshotFormat,
                    scale: config.screenshotScale)
                let contentType = config.screenshotFormat == .png ? "image/png" : "image/jpeg"
                return HTTPResponse.binary(data, contentType: contentType)
            } catch {
                return HTTPResponse.json([
                    "error": "screenshot-failed",
                    "detail": String(describing: error),
                ], status: 500)
            }

        case ("POST", "/input"):
            do {
                let batch = try JSONDecoder().decode(InputEventBatch.self, from: request.body)
                let n = InputInjector.shared.dispatchBatch(batch)
                return HTTPResponse.json(["dispatched": n])
            } catch {
                return HTTPResponse.json([
                    "error": "input-decode",
                    "detail": String(describing: error),
                ], status: 400)
            }

        case ("POST", "/snapshot"):
            let id: String?
            if !request.body.isEmpty,
               let body = try? JSONSerialization.jsonObject(with: request.body) as? [String: Any],
               let explicit = body["id"] as? String {
                id = explicit
            } else {
                id = nil
            }
            let captured = SnapshotProvider.shared.capture(id: id)
            return HTTPResponse.json(["id": captured])

        case ("GET", "/snapshots"):
            return HTTPResponse.json(["ids": SnapshotProvider.shared.list()])

        case ("POST", "/restore"):
            guard
                let body = try? JSONSerialization.jsonObject(with: request.body) as? [String: Any],
                let id = body["id"] as? String
            else {
                return HTTPResponse.json([
                    "error": "missing-id",
                    "detail": "POST /restore requires a JSON body with an 'id' field",
                ], status: 400)
            }
            let ok = SnapshotProvider.shared.restore(id: id)
            return HTTPResponse.json([
                "restored": ok,
                "id": id,
            ], status: ok ? 200 : 404)

        case ("POST", "/breakpoint"):
            guard
                let body = try? JSONSerialization.jsonObject(with: request.body) as? [String: Any]
            else {
                return HTTPResponse.json([
                    "error": "breakpoint-decode",
                    "detail": "POST /breakpoint requires a JSON body",
                ], status: 400)
            }
            if let action = body["action"] as? String {
                switch action {
                case "set-tags":
                    if let tags = body["tags"] as? [String] {
                        BreakpointProvider.shared.setPauseTags(tags)
                        return HTTPResponse.json(["set": tags])
                    }
                case "resume":
                    BreakpointProvider.shared.resume()
                    return HTTPResponse.json(["resumed": true])
                case "recent":
                    return HTTPResponse.json(["hits": BreakpointProvider.shared.recentHits()])
                default:
                    break
                }
            }
            return HTTPResponse.json([
                "error": "unknown-action",
                "expected": ["set-tags", "resume", "recent"],
            ], status: 400)

        case ("GET", _):
            return HTTPResponse.notFound
        case (_, _):
            return HTTPResponse.methodNotAllowed
        }
    }
}
