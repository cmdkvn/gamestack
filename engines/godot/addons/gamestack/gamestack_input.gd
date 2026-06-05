extends RefCounted

## Dispatches synthesized input events from POST /input to GDScript subscribers.
## Same event-based contract as the Unity SDK's InputInjector — the developer
## subscribes via Godot signals on the GameStack autoload.

signal on_input(event_data: Dictionary)


func dispatch(batch) -> Dictionary:
	var result := {
		"events_accepted": 0,
		"subscriber_count": 0,
		"error_count": 0,
	}
	if batch == null:
		return result
	if not (batch is Dictionary) or not batch.has("events"):
		return result

	var events = batch.events
	if not (events is Array):
		return result

	result.subscriber_count = on_input.get_connections().size()

	for evt in events:
		if evt == null:
			continue
		result.events_accepted += 1
		# Signal emission may throw if a connected callable errors out. Godot doesn't
		# expose a way to catch per-handler exceptions, so we count emissions and
		# trust the developer's adapter to be defensive.
		on_input.emit(evt)

	return result
