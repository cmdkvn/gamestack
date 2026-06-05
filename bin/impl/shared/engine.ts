import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type Engine = "unity" | "godot" | "unreal" | "gamemaker" | "bevy" | "web" | "unknown";

export function detectEngine(projectRoot: string): Engine {
  if (existsSync(join(projectRoot, "ProjectSettings", "ProjectSettings.asset"))) return "unity";
  if (existsSync(join(projectRoot, "Assets")) && existsSync(join(projectRoot, "ProjectSettings"))) return "unity";

  if (existsSync(join(projectRoot, "project.godot"))) return "godot";

  if (hasFileWithExt(projectRoot, ".uproject")) return "unreal";

  if (hasFileWithExt(projectRoot, ".yyp")) return "gamemaker";

  const cargo = join(projectRoot, "Cargo.toml");
  if (existsSync(cargo)) {
    try {
      const content = readFileSync(cargo, "utf8");
      if (/^\s*bevy\s*=/m.test(content) || /"bevy"/.test(content)) return "bevy";
    } catch { /* fall through */ }
  }

  if (existsSync(join(projectRoot, "package.json"))) return "web";

  return "unknown";
}

function hasFileWithExt(dir: string, ext: string): boolean {
  try {
    return readdirSync(dir).some((e) => e.toLowerCase().endsWith(ext));
  } catch {
    return false;
  }
}

export function assetRoots(projectRoot: string, engine: Engine): string[] {
  switch (engine) {
    case "unity":
      return [join(projectRoot, "Assets")];
    case "godot":
      return [projectRoot];
    case "unreal":
      return [join(projectRoot, "Content")];
    case "gamemaker":
      return [projectRoot];
    case "bevy":
      return [join(projectRoot, "assets")];
    case "web":
      return [
        join(projectRoot, "public"),
        join(projectRoot, "static"),
        join(projectRoot, "assets"),
      ];
    case "unknown":
      return [
        join(projectRoot, "assets"),
        join(projectRoot, "Assets"),
      ];
  }
}

export function assetExcludeDirs(engine: Engine): string[] {
  switch (engine) {
    case "unity":
      return ["Editor", "Plugins"];
    case "godot":
      return [".import", ".godot", "addons/.import"];
    case "unreal":
      return ["Intermediate", "Saved", "DerivedDataCache"];
    case "gamemaker":
      return [".gm", "cache", "tmp"];
    default:
      return [];
  }
}

export function scriptRoots(projectRoot: string, engine: Engine): string[] {
  switch (engine) {
    case "unity":
      return [join(projectRoot, "Assets"), join(projectRoot, "Packages")];
    case "godot":
      return [projectRoot];
    case "unreal":
      return [join(projectRoot, "Source"), join(projectRoot, "Content")];
    case "gamemaker":
      return [join(projectRoot, "scripts"), join(projectRoot, "objects")];
    case "bevy":
      return [join(projectRoot, "src")];
    case "web":
      return [join(projectRoot, "src")];
    case "unknown":
      return [projectRoot];
  }
}

export function scriptExtensions(engine: Engine): string[] {
  switch (engine) {
    case "unity":
      return [".cs"];
    case "godot":
      return [".gd", ".cs"];
    case "unreal":
      return [".cpp", ".h"];
    case "gamemaker":
      return [".gml"];
    case "bevy":
      return [".rs"];
    case "web":
      return [".ts", ".tsx", ".js", ".jsx"];
    case "unknown":
      return [".cs", ".gd", ".cpp", ".rs", ".gml", ".ts"];
  }
}
