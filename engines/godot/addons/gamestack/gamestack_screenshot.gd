extends RefCounted

## Captures the current viewport as a PNG or JPEG byte stream.
## MUST run on the main thread (called from the HTTP server's _process loop).

var _gamestack: Node


func _init(gs: Node) -> void:
	_gamestack = gs


func capture(config: Resource) -> PackedByteArray:
	var ml := Engine.get_main_loop()
	if not (ml is SceneTree):
		return PackedByteArray()
	var st: SceneTree = ml
	var viewport: Viewport = st.root
	if viewport == null:
		return PackedByteArray()

	var image: Image = viewport.get_texture().get_image()
	if image == null:
		return PackedByteArray()

	if config.screenshot_format == "jpg":
		return image.save_jpg_to_buffer(config.screenshot_jpeg_quality / 100.0)
	# Default to PNG.
	return image.save_png_to_buffer()
