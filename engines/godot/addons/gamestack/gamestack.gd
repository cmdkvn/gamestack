extends Node

## Autoload singleton for the gamestack engine SDK.
## Enabled automatically when the gamestack plugin is enabled.
##
## Public API (call from any node):
##   GameStack.expose(self, "hp", "player", Callable(self, "get_hp"))
##   GameStack.hit("after-boss-spawn")
##   GameStack.register_snapshotable(self)  # node must define _gamestack_* methods
##
## See addons/gamestack/README.md for the full contract.

const _ServerScript := preload("res://addons/gamestack/gamestack_server.gd")
const _StateScript := preload("res://addons/gamestack/gamestack_state.gd")
const _ScreenshotScript := preload("res://addons/gamestack/gamestack_screenshot.gd")
const _InputScript := preload("res://addons/gamestack/gamestack_input.gd")
const _SnapshotScript := preload("res://addons/gamestack/gamestack_snapshots.gd")
const _BreakpointScript := preload("res://addons/gamestack/gamestack_breakpoints.gd")
const _ConfigScript := preload("res://addons/gamestack/gamestack_config.gd")

@export var config: Resource = null  # GameStackConfig — if null, defaults are used

var server: Node
var state_provider: RefCounted
var screenshot_provider: RefCounted
var input_injector: RefCounted
var snapshot_provider: RefCounted
var breakpoint_provider: RefCounted


func _ready() -> void:
	if config == null:
		config = _ConfigScript.new()

	state_provider = _StateScript.new()
	screenshot_provider = _ScreenshotScript.new(self)
	input_injector = _InputScript.new()
	snapshot_provider = _SnapshotScript.new(state_provider)
	breakpoint_provider = _BreakpointScript.new()

	if not config.enabled:
		print("[gamestack] disabled via config; server not started")
		return

	server = _ServerScript.new()
	add_child(server)
	server.set_gamestack(self)
	if server.start(config):
		print("[gamestack] server started on http://%s:%d/" % [
			"127.0.0.1" if config.loopback_only else "*", config.port])
	else:
		push_error("[gamestack] server failed to start on port %d" % config.port)


func _exit_tree() -> void:
	if server != null and is_instance_valid(server):
		server.stop()


# ---------------------------------------------------------------- public API ---

## Expose a value for inclusion in GET /state. The callable is invoked each time
## /state is requested. Pass an optional `namespace` to group keys.
##
## Example:
##   GameStack.expose(self, "hp", "player", func(): return health)
##
## Registration is automatically cleaned up when the node is freed.
func expose(node: Node, key: String, ns: String, getter: Callable) -> void:
	state_provider.register(node, key, ns, getter)


## Drop a previously-exposed key. Usually unnecessary; freeing the node also clears it.
func unexpose(node: Node, key: String, ns: String = "default") -> void:
	state_provider.unregister(node, key, ns)


## Register a snapshotable node. The node must define:
##   func _gamestack_snapshot_key() -> String
##   func _gamestack_capture_snapshot() -> Variant
##   func _gamestack_restore_snapshot(payload: Variant) -> void
##
## The node receives capture / restore calls automatically when /snapshot and /restore are invoked.
func register_snapshotable(node: Node) -> void:
	snapshot_provider.register_snapshotable(node)


## Drop a snapshotable. Usually unnecessary; freeing the node also clears it.
func unregister_snapshotable(node: Node) -> void:
	snapshot_provider.unregister_snapshotable(node)


## Call from game code at semantic checkpoints. If the tag matches an active
## pause filter set by POST /breakpoint, the game pauses until /breakpoint resume.
func hit(tag: String) -> void:
	breakpoint_provider.hit(tag)


## True iff the breakpoint provider has the engine paused.
func is_paused() -> bool:
	return breakpoint_provider.is_paused
