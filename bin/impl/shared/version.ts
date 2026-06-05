// Single source of truth for the gamestack version is the VERSION file at the
// repo root. We read it lazily so CLIs print the on-disk version, not a value
// that happened to be hardcoded when this file was last edited.

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const FALLBACK_VERSION = "1.0.0";

function findVersionFile(): string | null {
  const start = dirname(fileURLToPath(import.meta.url));
  let dir = start;
  for (let i = 0; i < 8; i++) {
    const candidate = join(dir, "VERSION");
    if (existsSync(candidate)) return candidate;
    const parent = resolve(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function readVersion(): string {
  const path = findVersionFile();
  if (!path) return FALLBACK_VERSION;
  try {
    const raw = readFileSync(path, "utf8").trim();
    return raw || FALLBACK_VERSION;
  } catch {
    return FALLBACK_VERSION;
  }
}

export const GAMESTACK_CLI_VERSION = readVersion();
