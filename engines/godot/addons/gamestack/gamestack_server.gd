extends Node

## Minimal HTTP/1.1 server over TCPServer. Loopback-only by default.
## All routing runs on the main thread inside _process(), so providers can touch
## Godot APIs freely without dispatcher gymnastics (Unity's main-thread dispatcher
## isn't needed here).

const REQUEST_TIMEOUT_SECONDS := 5.0
const VERSION := "0.2.0"

var _gamestack: Node  # the GameStack autoload singleton
var _config: Resource  # GameStackConfig
var _server := TCPServer.new()
var _running := false
var _connections: Array = []  # each: {socket, buffer, started_at, parsed}


func set_gamestack(gs: Node) -> void:
	_gamestack = gs


func start(config: Resource) -> bool:
	_config = config
	var addr := "127.0.0.1" if config.loopback_only else "*"
	var err := _server.listen(config.port, addr)
	if err != OK:
		push_error("[gamestack] failed to listen on %s:%d (err=%d)" % [addr, config.port, err])
		return false
	_running = true
	return true


func stop() -> void:
	if not _running:
		return
	_server.stop()
	for c in _connections:
		var sock: StreamPeerTCP = c.socket
		if sock.get_status() == StreamPeerTCP.STATUS_CONNECTED:
			sock.disconnect_from_host()
	_connections.clear()
	_running = false


func _process(_delta: float) -> void:
	if not _running:
		return

	while _server.is_connection_available():
		var sock := _server.take_connection()
		if sock != null:
			_connections.append({
				"socket": sock,
				"buffer": PackedByteArray(),
				"started_at": Time.get_unix_time_from_system(),
				"parsed": null,
			})

	var to_remove: Array = []
	for i in range(_connections.size()):
		var c: Dictionary = _connections[i]
		var sock: StreamPeerTCP = c.socket
		sock.poll()
		var status := sock.get_status()
		if status == StreamPeerTCP.STATUS_NONE or status == StreamPeerTCP.STATUS_ERROR:
			to_remove.append(i)
			continue
		if Time.get_unix_time_from_system() - c.started_at > REQUEST_TIMEOUT_SECONDS:
			to_remove.append(i)
			continue

		var avail := sock.get_available_bytes()
		if avail > 0:
			var result = sock.get_data(avail)
			if result.size() == 2 and result[0] == OK:
				(c.buffer as PackedByteArray).append_array(result[1])

		if c.parsed == null:
			c.parsed = _try_parse_request(c.buffer)

		if c.parsed != null and (c.parsed.body_complete or c.parsed.method == "GET"):
			_handle_request(c)
			to_remove.append(i)

	# Remove handled / dead connections (high index first).
	to_remove.sort()
	to_remove.reverse()
	for i in to_remove:
		var c: Dictionary = _connections[i]
		var sock: StreamPeerTCP = c.socket
		if sock.get_status() == StreamPeerTCP.STATUS_CONNECTED:
			sock.disconnect_from_host()
		_connections.remove_at(i)


# ----------------------------------------------------------- request parsing ---

func _try_parse_request(buf: PackedByteArray):
	# Returns a Dictionary when headers are parsed (body may be incomplete), or null otherwise.
	var s := buf.get_string_from_utf8()
	var sep := s.find("\r\n\r\n")
	if sep == -1:
		return null

	var headers_str := s.substr(0, sep)
	var body_start := sep + 4

	var lines := headers_str.split("\r\n", false)
	if lines.is_empty():
		return null
	var request_line := (lines[0] as String).split(" ", false)
	if request_line.size() < 3:
		return null

	var method := request_line[0]
	var path := request_line[1]
	# Strip query string for routing.
	var qmark := path.find("?")
	if qmark != -1:
		path = path.substr(0, qmark)

	var headers := {}
	for i in range(1, lines.size()):
		var line: String = lines[i]
		var col := line.find(":")
		if col == -1:
			continue
		var k := line.substr(0, col).strip_edges().to_lower()
		var v := line.substr(col + 1).strip_edges()
		headers[k] = v

	var content_length := int(headers.get("content-length", "0"))
	var body_received := s.length() - body_start
	var body_complete: bool = body_received >= content_length
	var body := ""
	if body_complete and content_length > 0:
		body = s.substr(body_start, content_length)

	return {
		"method": method,
		"path": path,
		"headers": headers,
		"body": body,
		"body_complete": body_complete,
	}


# --------------------------------------------------------------- routing ---

func _handle_request(c: Dictionary) -> void:
	var req: Dictionary = c.parsed
	var route := "%s %s" % [req.method, req.path]

	var status_code := 200
	var content_type := "application/json"
	var resp_payload = null
	var body_bytes: PackedByteArray = PackedByteArray()

	match route:
		"GET /", "GET /health":
			resp_payload = {
				"ok": true,
				"status": "running",
				"version": VERSION,
				"endpoints": [
					"GET /health",
					"GET /state",
					"POST /screenshot",
					"POST /input",
					"POST /snapshot",
					"GET /snapshots",
					"POST /restore",
					"POST /breakpoint",
				],
			}

		"GET /state":
			resp_payload = _gamestack.state_provider.collect(_config.state_provider_cap)

		"POST /screenshot":
			var bytes: PackedByteArray = _gamestack.screenshot_provider.capture(_config)
			content_type = "image/png" if _config.screenshot_format == "png" else "image/jpeg"
			body_bytes = bytes

		"POST /input":
			var parsed_body = _parse_json_or_null(req.body)
			if parsed_body == null:
				status_code = 400
				resp_payload = {"error": "missing or invalid JSON body"}
			else:
				var result = _gamestack.input_injector.dispatch(parsed_body)
				resp_payload = {
					"ok": true,
					"eventsAccepted": result.events_accepted,
					"subscriberCount": result.subscriber_count,
					"errorCount": result.error_count,
				}

		"POST /snapshot":
			var snap_req = _parse_json_or_null(req.body)
			var explicit_id := ""
			if snap_req != null and snap_req.has("id"):
				explicit_id = String(snap_req.id)
			var id: String = _gamestack.snapshot_provider.capture(explicit_id)
			resp_payload = {"ok": true, "id": id}

		"GET /snapshots":
			resp_payload = {"ok": true, "snapshots": _gamestack.snapshot_provider.list_ids()}

		"POST /restore":
			var snap_req = _parse_json_or_null(req.body)
			if snap_req == null or not snap_req.has("id") or String(snap_req.id).is_empty():
				status_code = 400
				resp_payload = {"error": "missing id in JSON body"}
			else:
				var ok: bool = _gamestack.snapshot_provider.restore(String(snap_req.id))
				if not ok:
					status_code = 404
					resp_payload = {"error": "snapshot not found", "id": snap_req.id}
				else:
					resp_payload = {"ok": true, "id": snap_req.id}

		"POST /breakpoint":
			var br = _parse_json_or_null(req.body)
			if br == null or not br.has("action"):
				status_code = 400
				resp_payload = {"error": "missing or invalid JSON body"}
			else:
				_gamestack.breakpoint_provider.handle(br)
				resp_payload = _gamestack.breakpoint_provider.status()

		_:
			status_code = 404
			resp_payload = {"error": "not found", "route": route}

	if body_bytes.is_empty():
		body_bytes = JSON.stringify(resp_payload).to_utf8_buffer()

	var reason_phrase := _status_phrase(status_code)
	var header := "HTTP/1.1 %d %s\r\nContent-Type: %s\r\nContent-Length: %d\r\nCache-Control: no-store\r\nConnection: close\r\n\r\n" % [
		status_code, reason_phrase, content_type, body_bytes.size()
	]
	var full := header.to_utf8_buffer()
	full.append_array(body_bytes)
	(c.socket as StreamPeerTCP).put_data(full)


# ----------------------------------------------------------------- helpers ---

func _parse_json_or_null(body: String):
	if body.is_empty():
		return null
	var parsed = JSON.parse_string(body)
	return parsed


func _status_phrase(code: int) -> String:
	match code:
		200: return "OK"
		400: return "Bad Request"
		404: return "Not Found"
		500: return "Internal Server Error"
		_: return "OK"
