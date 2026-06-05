extends Node

## Lightweight self-tests for the Godot gamestack providers. Designed to run
## from a debug menu, the in-editor "Run Custom Scene" workflow, or a CI-only
## scene. Not a GUT/test-framework integration — we keep the addon zero-dep.
##
## Usage:
##   1. Open Godot.
##   2. File > Open Scene > engines/godot/tests/test_runner.tscn (create per the
##      template at the bottom of this file).
##   3. Press play; results print to the console; the scene closes itself.
##
## Or, programmatically:
##   add_child(load("res://engines/godot/tests/test_gamestack.gd").new())
##   await get_tree().process_frame

const _SnapshotProviderScript := preload("res://addons/gamestack/gamestack_snapshots.gd")
const _StateProviderScript := preload("res://addons/gamestack/gamestack_state.gd")
const _BreakpointProviderScript := preload("res://addons/gamestack/gamestack_breakpoints.gd")
const _InputInjectorScript := preload("res://addons/gamestack/gamestack_input.gd")

var _passes := 0
var _fails := 0
var _failures: Array[String] = []


func _ready() -> void:
	print("[gamestack:test] starting")
	_test_state_register_and_collect()
	_test_state_unregister()
	_test_snapshot_round_trip_time_scale()
	_test_snapshot_round_trip_custom()
	_test_breakpoint_pause_resume()
	_test_breakpoint_wildcard()
	_test_breakpoint_recent_hits()
	_test_input_dispatch_counts()

	print("[gamestack:test] passes=%d fails=%d" % [_passes, _fails])
	for f in _failures:
		print("  ! %s" % f)

	if _fails == 0:
		print("[gamestack:test] all green")
	else:
		push_error("[gamestack:test] %d failure(s) — see log" % _fails)


# ---------------- assertions ----------------

func _assert(condition: bool, label: String) -> void:
	if condition:
		_passes += 1
	else:
		_fails += 1
		_failures.append(label)


func _assert_eq(actual, expected, label: String) -> void:
	_assert(actual == expected, "%s — expected %s got %s" % [label, expected, actual])


# ---------------- state ----------------

func _test_state_register_and_collect() -> void:
	var provider = _StateProviderScript.new()
	var holder := Node.new()
	holder.set_meta("hp", 100)
	add_child(holder)
	provider.register(holder, "hp", "player", Callable(self, "_get_holder_hp").bind(holder))

	var state = provider.collect()
	_assert(state.has("tagged"), "state.tagged present")
	_assert_eq(state.tagged.get("player", {}).get("hp"), 100, "tagged.player.hp == 100")

	holder.queue_free()


func _get_holder_hp(holder: Node):
	return holder.get_meta("hp")


func _test_state_unregister() -> void:
	var provider = _StateProviderScript.new()
	var holder := Node.new()
	add_child(holder)
	provider.register(holder, "k", "ns", func(): return 1)
	provider.unregister(holder, "k", "ns")
	var state = provider.collect()
	_assert(not state.has("tagged") or not state.tagged.has("ns"), "unregistered key absent")
	holder.queue_free()


# ---------------- snapshot ----------------

class _Snapshotable extends Node:
	var payload: String = "before"
	func _gamestack_snapshot_key() -> String:
		return "test-snapshotable"
	func _gamestack_capture_snapshot():
		return {"payload": payload}
	func _gamestack_restore_snapshot(data):
		payload = data.get("payload", "")


func _test_snapshot_round_trip_time_scale() -> void:
	var state_provider = _StateProviderScript.new()
	var provider = _SnapshotProviderScript.new(state_provider)
	var original := Engine.time_scale
	Engine.time_scale = 0.5
	var id: String = provider.capture()
	Engine.time_scale = 2.0
	var ok: bool = provider.restore(id)
	_assert(ok, "restore returns true")
	_assert(abs(Engine.time_scale - 0.5) < 0.001, "time_scale restored to 0.5")
	Engine.time_scale = original


func _test_snapshot_round_trip_custom() -> void:
	var state_provider = _StateProviderScript.new()
	var provider = _SnapshotProviderScript.new(state_provider)
	var node := _Snapshotable.new()
	add_child(node)
	provider.register_snapshotable(node)
	node.payload = "before"
	var id: String = provider.capture()
	node.payload = "after"
	var ok: bool = provider.restore(id)
	_assert(ok, "custom restore returns true")
	_assert_eq(node.payload, "before", "custom payload restored")
	node.queue_free()


# ---------------- breakpoint ----------------

func _test_breakpoint_pause_resume() -> void:
	var provider = _BreakpointProviderScript.new()
	provider.reset()
	provider.add_pause_tag("checkpoint")
	provider.hit("other")
	_assert(not provider.is_paused, "no pause on non-matching tag")
	provider.hit("checkpoint")
	_assert(provider.is_paused, "pause on matching tag")
	_assert_eq(provider.last_paused_at, "checkpoint", "last_paused_at == checkpoint")
	_assert(abs(Engine.time_scale - 0.0) < 0.001, "time_scale == 0 while paused")
	provider.resume()
	_assert(not provider.is_paused, "not paused after resume")


func _test_breakpoint_wildcard() -> void:
	var provider = _BreakpointProviderScript.new()
	provider.reset()
	provider.add_pause_tag("*")
	provider.hit("anything")
	_assert(provider.is_paused, "wildcard pauses on any tag")
	provider.resume()


func _test_breakpoint_recent_hits() -> void:
	var provider = _BreakpointProviderScript.new()
	provider.reset()
	provider.hit("a")
	provider.hit("b")
	provider.hit("c")
	var s = provider.status()
	_assert(s.recentHits.size() == 3, "recent_hits has 3 entries")
	_assert_eq(s.recentHits[0], "a", "first hit recorded first")
	_assert_eq(s.recentHits[2], "c", "last hit recorded last")


# ---------------- input ----------------

func _test_input_dispatch_counts() -> void:
	var injector = _InputInjectorScript.new()
	var batch := {"events": [
		{"device": "Keyboard", "action": "Press", "control": "Space"},
		{"device": "Keyboard", "action": "Release", "control": "Space"},
	]}
	var result: Dictionary = injector.dispatch(batch)
	_assert_eq(result.events_accepted, 2, "two events accepted")
	# Subscriber count is 0 in this test since we didn't connect to on_input.
	_assert_eq(result.subscriber_count, 0, "no subscribers")
