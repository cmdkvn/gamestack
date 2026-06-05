extends RefCounted

## In-memory snapshot store. Captures:
##  - Engine.time_scale, current scene name.
##  - All `GameStack.expose()`d values (read via their callables).
##  - Custom payloads from nodes registered via GameStack.register_snapshotable().
##
## Snapshots live until the process exits — they're for live test sessions,
## NOT the player save system.

var _state_provider  # gamestack_state.gd instance
var _store: Dictionary = {}      # id -> snapshot dict
var _snapshotables: Array = []   # array of WeakRef to nodes implementing _gamestack_* methods
var _auto_counter: int = 0


func _init(state_provider) -> void:
	_state_provider = state_provider


func register_snapshotable(node: Node) -> void:
	if node == null:
		return
	# De-dupe.
	for w in _snapshotables:
		var n = w.get_ref()
		if n == node:
			return
	if not node.has_method("_gamestack_snapshot_key"):
		push_warning("[gamestack] register_snapshotable: %s lacks _gamestack_snapshot_key()" % node)
		return
	_snapshotables.append(weakref(node))


func unregister_snapshotable(node: Node) -> void:
	if node == null:
		return
	var keep: Array = []
	for w in _snapshotables:
		var n = w.get_ref()
		if n == null or n == node:
			continue
		keep.append(w)
	_snapshotables = keep


func capture(explicit_id: String = "") -> String:
	_compact_snapshotables()
	_auto_counter += 1
	var id := explicit_id if explicit_id != "" else "snap-%04d" % _auto_counter

	var snap := {
		"__meta__": {
			"id": id,
			"timestamp": Time.get_datetime_string_from_system(true),
			"scene": _current_scene_name(),
			"timeScale": Engine.time_scale,
		},
	}

	# Capture exposed values by replaying the state provider's registrations.
	var current := _state_provider.collect()
	if current.has("tagged"):
		snap["tagged"] = current.tagged.duplicate(true)
	else:
		snap["tagged"] = {}

	# Capture snapshotables.
	var customs := {}
	for w in _snapshotables:
		var node = w.get_ref()
		if node == null or not is_instance_valid(node):
			continue
		var key: String = node.call("_gamestack_snapshot_key")
		if key == null or key == "":
			continue
		var payload = node.call("_gamestack_capture_snapshot")
		customs[key] = payload
	snap["custom"] = customs

	_store[id] = snap
	return id


func restore(id: String) -> bool:
	if id == "" or not _store.has(id):
		return false
	var snap: Dictionary = _store[id]

	# Restore time scale from meta.
	if snap.has("__meta__"):
		var meta: Dictionary = snap.__meta__
		if meta.has("timeScale"):
			Engine.time_scale = float(meta.timeScale)

	# Tagged-value restoration: we don't have setters registered (the expose API is read-only).
	# Nodes that need restore must implement the IGameStackSnapshotable-equivalent methods.

	# Restore IGameStackSnapshotable payloads.
	if snap.has("custom"):
		var customs: Dictionary = snap.custom
		for w in _snapshotables:
			var node = w.get_ref()
			if node == null or not is_instance_valid(node):
				continue
			var key: String = node.call("_gamestack_snapshot_key")
			if customs.has(key):
				node.call("_gamestack_restore_snapshot", customs[key])

	return true


func list_ids() -> Array:
	return _store.keys()


func delete(id: String) -> bool:
	if not _store.has(id):
		return false
	_store.erase(id)
	return true


func clear() -> void:
	_store.clear()


# -------- helpers --------

func _current_scene_name() -> String:
	var ml := Engine.get_main_loop()
	if ml is SceneTree:
		var st: SceneTree = ml
		if st.current_scene != null:
			return st.current_scene.name
	return ""


func _compact_snapshotables() -> void:
	var keep: Array = []
	for w in _snapshotables:
		if w.get_ref() == null:
			continue
		keep.append(w)
	_snapshotables = keep
