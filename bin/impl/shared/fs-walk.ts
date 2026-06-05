import { readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

export interface WalkedFile {
  absPath: string;
  relPath: string;
  size: number;
  ext: string;
  baseName: string;
}

export interface WalkOptions {
  excludeDirNames?: string[];
  excludeRelPaths?: string[];
  maxDepth?: number;
}

export function walk(root: string, opts: WalkOptions = {}): WalkedFile[] {
  const excludeDirNames = new Set(opts.excludeDirNames ?? []);
  const excludeRelPaths = new Set((opts.excludeRelPaths ?? []).map(normalize));
  const maxDepth = opts.maxDepth ?? 64;
  const results: WalkedFile[] = [];

  function normalize(p: string): string {
    return p.split(sep).join("/");
  }

  function rec(dir: string, depth: number): void {
    if (depth > maxDepth) return;
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const e of entries) {
      const abs = join(dir, e);
      const rel = normalize(relative(root, abs));
      if (excludeRelPaths.has(rel)) continue;
      if (excludeDirNames.has(e)) continue;
      let st;
      try {
        st = statSync(abs);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        rec(abs, depth + 1);
      } else if (st.isFile()) {
        const dot = e.lastIndexOf(".");
        const ext = dot >= 0 ? e.slice(dot).toLowerCase() : "";
        results.push({ absPath: abs, relPath: rel, size: st.size, ext, baseName: e });
      }
    }
  }

  rec(root, 0);
  return results;
}

export function grepFiles(files: WalkedFile[], extensions: string[], patterns: RegExp[]): Map<RegExp, WalkedFile[]> {
  const extSet = new Set(extensions.map((e) => e.toLowerCase()));
  const matched = new Map<RegExp, WalkedFile[]>();
  for (const p of patterns) matched.set(p, []);
  for (const f of files) {
    if (!extSet.has(f.ext)) continue;
    let content: string;
    try {
      const fs = require("node:fs");
      content = fs.readFileSync(f.absPath, "utf8");
    } catch {
      continue;
    }
    for (const p of patterns) {
      if (p.test(content)) matched.get(p)!.push(f);
    }
  }
  return matched;
}
