import Foundation
import Network

/// Minimal loopback HTTP/1.1 server backed by `Network.framework`.
///
/// Why hand-rolled instead of a dependency: gamestack's engine SDK is a debug
/// tool that drops into someone else's app. Adding Vapor / Hummingbird /
/// SwiftNIO would pull megabytes of transitive deps into a build that's only
/// ever used during development. The full HTTP surface area we need is tiny:
/// request line, content-length-bounded body, JSON or binary response.
///
/// Bound to 127.0.0.1 by default (`config.loopbackOnly == true`). Refuses
/// non-loopback bind in release builds — mirror of the Unity / Godot SDKs.
final class HTTPServer: @unchecked Sendable {
    typealias Handler = @Sendable (HTTPRequest) async -> HTTPResponse

    private let queue = DispatchQueue(label: "gamestack.http.server")
    private var listener: NWListener?
    private let port: UInt16
    private let loopbackOnly: Bool
    private let handler: Handler
    private let lock = NSLock()
    private var connections: [NWConnection] = []

    init(port: UInt16, loopbackOnly: Bool, handler: @escaping Handler) {
        self.port = port
        self.loopbackOnly = loopbackOnly
        self.handler = handler
    }

    func start() throws {
        let params = NWParameters.tcp
        if loopbackOnly {
            params.requiredInterfaceType = .loopback
        }
        guard let nwPort = NWEndpoint.Port(rawValue: port) else {
            throw GameStackError.invalidPort(port)
        }
        let listener = try NWListener(using: params, on: nwPort)
        listener.newConnectionHandler = { [weak self] conn in
            self?.accept(conn)
        }
        listener.start(queue: queue)
        self.listener = listener
    }

    func stop() {
        listener?.cancel()
        listener = nil
        lock.lock()
        let conns = connections
        connections.removeAll()
        lock.unlock()
        for c in conns { c.cancel() }
    }

    private func accept(_ conn: NWConnection) {
        lock.lock(); connections.append(conn); lock.unlock()
        conn.stateUpdateHandler = { [weak self] state in
            switch state {
            case .failed, .cancelled:
                self?.remove(conn)
            default:
                break
            }
        }
        conn.start(queue: queue)
        receive(on: conn, accumulator: Data())
    }

    private func remove(_ conn: NWConnection) {
        lock.lock()
        if let i = connections.firstIndex(where: { ObjectIdentifier($0) == ObjectIdentifier(conn) }) {
            connections.remove(at: i)
        }
        lock.unlock()
    }

    private func receive(on conn: NWConnection, accumulator: Data) {
        conn.receive(minimumIncompleteLength: 1, maximumLength: 64 * 1024) { [weak self] data, _, isComplete, error in
            guard let self else { return }
            var buf = accumulator
            if let data = data { buf.append(data) }

            if let parsed = HTTPRequest.parse(from: buf) {
                Task { [handler = self.handler] in
                    let response = await handler(parsed.request)
                    self.write(response, to: conn)
                }
                return
            }

            if error != nil || isComplete {
                conn.cancel()
                return
            }
            // Need more bytes.
            self.receive(on: conn, accumulator: buf)
        }
    }

    private func write(_ response: HTTPResponse, to conn: NWConnection) {
        let head = response.serializeHead()
        conn.send(content: head, completion: .contentProcessed { _ in
            if let body = response.body, !body.isEmpty {
                conn.send(content: body, completion: .contentProcessed { _ in
                    conn.cancel()
                })
            } else {
                conn.cancel()
            }
        })
    }
}

// MARK: - Request / response

struct HTTPRequest: Sendable {
    let method: String
    let path: String
    let query: [String: String]
    let headers: [String: String]
    let body: Data

    static func parse(from data: Data) -> (request: HTTPRequest, leftover: Data)? {
        // Find header/body boundary.
        guard let separator = data.range(of: Data([0x0D, 0x0A, 0x0D, 0x0A])) else {
            return nil
        }
        let headerData = data.subdata(in: 0..<separator.lowerBound)
        guard let headerText = String(data: headerData, encoding: .utf8) else {
            return nil
        }
        let lines = headerText.components(separatedBy: "\r\n")
        guard let requestLine = lines.first else { return nil }
        let parts = requestLine.components(separatedBy: " ")
        guard parts.count >= 2 else { return nil }
        let method = parts[0]
        let target = parts[1]

        var headers: [String: String] = [:]
        for line in lines.dropFirst() {
            guard let colon = line.firstIndex(of: ":") else { continue }
            let name = String(line[..<colon]).lowercased()
            let value = String(line[line.index(after: colon)...]).trimmingCharacters(in: .whitespaces)
            headers[name] = value
        }

        let contentLength = Int(headers["content-length"] ?? "0") ?? 0
        let bodyStart = separator.upperBound
        let available = data.count - bodyStart
        if available < contentLength {
            return nil
        }
        let body = data.subdata(in: bodyStart..<(bodyStart + contentLength))

        var path = target
        var query: [String: String] = [:]
        if let q = target.firstIndex(of: "?") {
            path = String(target[..<q])
            let queryString = String(target[target.index(after: q)...])
            for pair in queryString.split(separator: "&") {
                let kv = pair.split(separator: "=", maxSplits: 1)
                guard let key = kv.first.map(String.init)?.removingPercentEncoding else { continue }
                let value = kv.count > 1 ? (String(kv[1]).removingPercentEncoding ?? "") : ""
                query[key] = value
            }
        }

        let leftover = data.subdata(in: (bodyStart + contentLength)..<data.count)
        return (HTTPRequest(method: method, path: path, query: query, headers: headers, body: body), leftover)
    }
}

struct HTTPResponse: Sendable {
    let status: Int
    let statusText: String
    let headers: [String: String]
    let body: Data?

    static func json(_ value: Any, status: Int = 200) -> HTTPResponse {
        let body: Data
        do {
            body = try JSONSerialization.data(withJSONObject: value, options: [])
        } catch {
            return HTTPResponse(status: 500, statusText: "Internal Server Error",
                                headers: ["content-type": "application/json"],
                                body: Data("{\"error\":\"json-encode\"}".utf8))
        }
        return HTTPResponse(status: status,
                            statusText: status == 200 ? "OK" : "Error",
                            headers: ["content-type": "application/json"],
                            body: body)
    }

    static func binary(_ data: Data, contentType: String) -> HTTPResponse {
        HTTPResponse(status: 200, statusText: "OK",
                     headers: ["content-type": contentType],
                     body: data)
    }

    static func text(_ text: String, status: Int = 200) -> HTTPResponse {
        HTTPResponse(status: status,
                     statusText: status == 200 ? "OK" : "Error",
                     headers: ["content-type": "text/plain"],
                     body: Data(text.utf8))
    }

    static let notFound = HTTPResponse(status: 404, statusText: "Not Found",
                                       headers: ["content-type": "application/json"],
                                       body: Data("{\"error\":\"not-found\"}".utf8))

    static let methodNotAllowed = HTTPResponse(status: 405, statusText: "Method Not Allowed",
                                               headers: ["content-type": "application/json"],
                                               body: Data("{\"error\":\"method-not-allowed\"}".utf8))

    func serializeHead() -> Data {
        var head = "HTTP/1.1 \(status) \(statusText)\r\n"
        var hs = headers
        if let body = body { hs["content-length"] = "\(body.count)" } else { hs["content-length"] = "0" }
        hs["connection"] = "close"
        for (k, v) in hs {
            head += "\(k): \(v)\r\n"
        }
        head += "\r\n"
        return Data(head.utf8)
    }
}

enum GameStackError: Error {
    case invalidPort(UInt16)
    case alreadyRunning
    case bindFailed(Error)
}
