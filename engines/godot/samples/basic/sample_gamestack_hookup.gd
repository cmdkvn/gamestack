extends Node

## Minimal end-to-end wiring for the Godot gamestack SDK.
## Drop this Node into a scene alongside any Player/World logic.

var button_presses: int = 0
var last_control: String = ""


func _ready() -> void:
	# Expose two values to GET /state under the "sample" namespace.
	GameStack.expose(self, "buttonPresses", "sample", Callable(self, "_get_button_presses"))
	GameStack.expose(self, "lastControl", "sample", Callable(self, "_get_last_control"))

	# Subscribe to /input dispatches.
	GameStack.input_injector.on_input.connect(_on_input)

	# Listen for breakpoint state transitions so we can log them.
	GameStack.breakpoint_provider.on_pause.connect(_on_paused)
	GameStack.breakpoint_provider.on_resume.connect(_on_resumed)

	# Register ourselves as snapshotable so /snapshot captures button_presses too.
	GameStack.register_snapshotable(self)


# ----- exposes -----

func _get_button_presses() -> int:
	return button_presses


func _get_last_control() -> String:
	return last_control


# ----- input adapter -----

func _on_input(event_data: Dictionary) -> void:
	button_presses += 1
	last_control = "%s.%s.%s" % [
		event_data.get("device", ""),
		event_data.get("control", ""),
		event_data.get("action", ""),
	]

	# In a real game, you'd translate event_data to in-game actions here.
	# For example:
	#   if event_data.control == "Space" and event_data.action == "Press":
	#       player.jump()

	# Record a semantic checkpoint that POST /breakpoint can pause on.
	GameStack.hit("input." + str(event_data.get("control", "")))


# ----- breakpoint hooks -----

func _on_paused(tag: String) -> void:
	print("[sample] paused at: ", tag)


func _on_resumed() -> void:
	print("[sample] resumed")


# ----- IGameStackSnapshotable-equivalent (duck-typed) -----

func _gamestack_snapshot_key() -> String:
	return "sample-hookup"


func _gamestack_capture_snapshot() -> Variant:
	return {
		"button_presses": button_presses,
		"last_control": last_control,
	}


func _gamestack_restore_snapshot(payload: Variant) -> void:
	if payload is Dictionary:
		button_presses = int(payload.get("button_presses", 0))
		last_control = String(payload.get("last_control", ""))
