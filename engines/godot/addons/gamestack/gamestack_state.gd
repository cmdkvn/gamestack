extends RefCounted

## Collects the JSON-serializable state snapshot returned by GET /state.
##
## GDScript has no attribute system, so state contributors register themselves
## explicitly via GameStack.expose(self, "hp", "player", callable). The provider
## holds weak references; freed nodes are cleared lazily.

class _Registration:
	var node_id: int
	var node_ref: WeakRef
	var key: String
	var ns: String
	var getter: Callable

	func _init(node: Node, k: String, n: String, g: Callable) -> void:
		node_id = node.get_instance_id()
		node_ref = weakref(node)
		key = k
		ns = n if n != "" else "default"
		getter = g


var _registrations: Array[_Registration] = []


func register(node: Node, key: String, ns: String, getter: Callable) -> void:
	if node == null or not getter.is_valid():
		return
	# Replace prior registration with the same node+ns+key (idempotent).
	for r in _registrations:
		if r.node_id == node.get_instance_id() and r.key == key and r.ns == (ns if ns != "" else "default"):
			r.getter = getter
			return
	_registrations.append(_Registration.new(node, key, ns, getter))
	# Clean up automatically when the node leaves the tree.
	if not node.tree_exiting.is_connected(_on_node_exiting):
		node.tree_exiting.connect(_on_node_exiting.bind(node.get_instance_id()))


func unregister(node: Node, key: String, ns: String = "default") -> void:
	if node == null:
		return
	var nid := node.get_instance_id()
	var keep: Array[_Registration] = []
	for r in _registrations:
		if r.node_id == nid and r.key == key and r.ns == ns:
			continue
		keep.append(r)
	_registrations = keep


func collect(max_count: int = 2000) -> Dictionary:
	_compact()
	var state := {
		"scene": _current_scene_name(),
		"fps": Engine.get_frames_per_second(),
		"frameTimeMs": (1000.0 / max(Engine.get_frames_per_second(), 1)) if Engine.get_frames_per_second() > 0 else 0.0,
		"engineVersion": Engine.get_version_info().get("string", "unknown"),
		"platform": OS.get_name(),
		"isEditor": Engine.is_editor_hint(),
		"timeScale": Engine.time_scale,
		"physicsTicksPerSecond": Engine.physics_ticks_per_second,
	}

	var tagged := {}
	var count := 0
	for r in _registrations:
		if count >= max_count:
			break
		var node = r.node_ref.get_ref()
		if node == null:
			continue
		var bucket: Dictionary = tagged.get(r.ns, {})
		var value = null
		var got: bool = true
		# Call the getter; tolerate exceptions by recording null.
		# GDScript can't catch errors from Callables, so we rely on developer cleanliness.
		value = r.getter.call()
		bucket[r.key] = _serializable(value)
		tagged[r.ns] = bucket
		count += 1

	if not tagged.is_empty():
		state["tagged"] = tagged

	return state


# -------- helpers --------

func _current_scene_name() -> String:
	# Use Engine main loop introspection — autoload runs before scene_tree is fully set up
	# in some edge cases, so guard.
	var ml := Engine.get_main_loop()
	if ml is SceneTree:
		var st: SceneTree = ml
		if st.current_scene != null:
			return st.current_scene.name
	return ""


func _on_node_exiting(node_id: int) -> void:
	_remove_by_node_id(node_id)


func _remove_by_node_id(node_id: int) -> void:
	var keep: Array[_Registration] = []
	for r in _registrations:
		if r.node_id == node_id:
			continue
		keep.append(r)
	_registrations = keep


func _compact() -> void:
	var keep: Array[_Registration] = []
	for r in _registrations:
		if r.node_ref.get_ref() == null:
			continue
		keep.append(r)
	_registrations = keep


func _serializable(value):
	if value == null:
		return null
	var t := typeof(value)
	match t:
		TYPE_BOOL, TYPE_INT, TYPE_FLOAT, TYPE_STRING, TYPE_STRING_NAME:
			return value
		TYPE_VECTOR2:
			return {"x": value.x, "y": value.y}
		TYPE_VECTOR3:
			return {"x": value.x, "y": value.y, "z": value.z}
		TYPE_VECTOR4:
			return {"x": value.x, "y": value.y, "z": value.z, "w": value.w}
		TYPE_QUATERNION:
			return {"x": value.x, "y": value.y, "z": value.z, "w": value.w}
		TYPE_COLOR:
			return {"r": value.r, "g": value.g, "b": value.b, "a": value.a}
		TYPE_RECT2:
			return {"x": value.position.x, "y": value.position.y, "w": value.size.x, "h": value.size.y}
		TYPE_DICTIONARY, TYPE_ARRAY:
			# These are JSON-compatible already; let JSON.stringify handle them.
			return value
		_:
			return str(value)
