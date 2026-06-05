extends RefCounted

## Tag-based breakpoint store. Mirrors the Unity SDK's BreakpointProvider.
##
## Game code calls GameStack.hit("tag") at semantic checkpoints. If the tag matches
## an active pause filter, the engine pauses (Engine.time_scale = 0) until /breakpoint
## resume is called.

signal on_hit(tag: String)
signal on_pause(tag: String)
signal on_resume

const RECENT_HITS_CAPACITY := 64

var is_paused: bool = false
var last_paused_at: String = ""

var _pause_tags: Dictionary = {}     # tag -> true (used as set)
var _recent_hits: Array[String] = []
var _time_scale_before_pause: float = 1.0
var _step_requested: bool = false


func hit(tag: String) -> void:
	if tag == null or tag == "":
		return

	_enqueue_recent(tag)
	on_hit.emit(tag)

	if _pause_tags.has(tag) or _pause_tags.has("*"):
		_pause_internal(tag)


func add_pause_tag(tag: String) -> void:
	if tag != "":
		_pause_tags[tag] = true


func remove_pause_tag(tag: String) -> void:
	_pause_tags.erase(tag)


func clear_pause_tags() -> void:
	_pause_tags.clear()


func resume() -> void:
	if not is_paused:
		return
	Engine.time_scale = _time_scale_before_pause
	is_paused = false
	on_resume.emit()


func step() -> void:
	_step_requested = true
	if is_paused:
		resume()


func pause_now(reason: String = "manual") -> void:
	_pause_internal(reason)


func reset() -> void:
	if is_paused:
		resume()
	_pause_tags.clear()
	_recent_hits.clear()
	last_paused_at = ""
	_step_requested = false


## Returns a status dictionary that mirrors the Unity SDK's /breakpoint response.
func status() -> Dictionary:
	return {
		"ok": true,
		"isPaused": is_paused,
		"lastPausedAt": last_paused_at,
		"pauseOnTags": _pause_tags.keys(),
		"recentHits": _recent_hits.duplicate(),
	}


## Handles a POST /breakpoint request body.
func handle(req: Dictionary) -> void:
	var action: String = String(req.get("action", "status"))
	var tag: String = String(req.get("tag", ""))

	match action:
		"add-pause":
			add_pause_tag(tag)
		"remove-pause":
			remove_pause_tag(tag)
		"clear-pause":
			clear_pause_tags()
		"resume":
			resume()
		"step":
			step()
		"pause-now":
			pause_now(tag if tag != "" else "manual")
		"status":
			# Reading state happens in status() — nothing to do.
			pass
		_:
			push_warning("[gamestack] unknown breakpoint action: %s" % action)


# -------- internals --------

func _pause_internal(tag: String) -> void:
	if is_paused and not _step_requested:
		last_paused_at = tag
		return
	if _step_requested:
		_step_requested = false
	_time_scale_before_pause = Engine.time_scale
	Engine.time_scale = 0.0
	is_paused = true
	last_paused_at = tag
	on_pause.emit(tag)


func _enqueue_recent(tag: String) -> void:
	_recent_hits.append(tag)
	while _recent_hits.size() > RECENT_HITS_CAPACITY:
		_recent_hits.pop_front()
