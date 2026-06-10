#!/usr/bin/env bun
import { ArgError, parseArgv, parseCommonOptions } from "../shared/args.ts";
import { GAMESTACK_CLI_VERSION } from "../shared/version.ts";
import { startBridge } from "./bridge.ts";

const HELP = `gamestack-web-bridge — loopback HTTP bridge for the gamestack web SDK

Usage:
  gamestack-web-bridge [--port <n>]

A browser page cannot host an HTTP server, so the web SDK splits in two:
the browser-side client (engines/web/src/gamestack-client.js) connects OUT
to this bridge over a loopback WebSocket (path /__client), and the bridge
hosts the eight gamestack HTTP endpoints (/health /state /screenshot /input
/snapshot /snapshots /restore /breakpoint) that skills and the playtest
daemon already speak. Start the bridge, open the game in a browser, then
point /playtest (or curl) at http://127.0.0.1:<port>.

One game client at a time: a newer connection replaces the older one (a page
reload reconnects cleanly). /health always answers 200; the other endpoints
answer 503 until a game client is connected. Loopback only — never exposed
beyond 127.0.0.1.

Options:
  --port <n>     HTTP + WebSocket port (default: 7334).
  -h, --help     Show this help.
  -v, --version  Print version.

Exit codes:
  0   Clean exit (help / version / SIGINT).
  2   Invalid args.
  127 bun not installed.

Examples:
  gamestack-web-bridge
  gamestack-web-bridge --port 7400
`;

function main(argv: string[]): number | null {
  let parsed;
  try {
    parsed = parseArgv(argv);
  } catch (err) {
    process.stderr.write(`error: ${(err as Error).message}\n`);
    return 2;
  }

  let common;
  try {
    common = parseCommonOptions(parsed);
  } catch (err) {
    if (err instanceof ArgError) {
      process.stderr.write(`error: ${err.message}\n\n${HELP}`);
      return 2;
    }
    throw err;
  }

  if (common.showHelp) {
    process.stdout.write(HELP);
    return 0;
  }
  if (common.showVersion) {
    process.stdout.write(`gamestack-web-bridge ${GAMESTACK_CLI_VERSION}\n`);
    return 0;
  }

  const portRaw = parsed.get("port") ?? "7334";
  const port = Number(portRaw);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    process.stderr.write(`error: --port must be an integer in [0, 65535] (got '${portRaw}')\n`);
    return 2;
  }

  const hostname = "127.0.0.1";
  let bridge;
  try {
    bridge = startBridge({ port, hostname });
  } catch (err) {
    process.stderr.write(`error: ${(err as Error).message}\n`);
    return 2;
  }

  process.stdout.write(
    `gamestack-web-bridge listening on http://${hostname}:${bridge.port} — waiting for a game client\n`,
  );

  const shutdown = async () => {
    await bridge.stop();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  return null; // keep running; Bun.serve holds the event loop open
}

const code = main(process.argv.slice(2));
if (code !== null) process.exit(code);
