extends Resource
class_name GameStackConfig

## Configuration Resource for the gamestack server.
## Create via FileSystem > Right-click > New Resource > GameStackConfig (or via code).
## The default config is created automatically if no Resource is assigned to GameStack.config.

@export_group("Server")
## TCP port the gamestack server listens on. Default 7332 (Unity SDK uses 7331).
@export var port: int = 7332

## Enable the server. Turn off in shipping exports.
@export var enabled: bool = true

## Only accept connections from 127.0.0.1. Strongly recommended to keep on.
@export var loopback_only: bool = true

@export_group("State")
## Maximum count of registered state providers to query per /state. Guard against runaway registration.
@export_range(1, 10000) var state_provider_cap: int = 2000

@export_group("Screenshot")
## Output format for /screenshot: "png" or "jpg".
@export_enum("png", "jpg") var screenshot_format: String = "png"

## JPEG quality 1-100 (only used when screenshot_format = "jpg").
@export_range(1, 100) var screenshot_jpeg_quality: int = 85
