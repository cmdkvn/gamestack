@tool
extends EditorPlugin

# Adds the GameStack autoload singleton when the plugin is enabled.
# The singleton starts the HTTP server in _ready() based on its config.

const AUTOLOAD_NAME := "GameStack"
const AUTOLOAD_PATH := "res://addons/gamestack/gamestack.gd"


func _enter_tree() -> void:
	add_autoload_singleton(AUTOLOAD_NAME, AUTOLOAD_PATH)


func _exit_tree() -> void:
	remove_autoload_singleton(AUTOLOAD_NAME)
