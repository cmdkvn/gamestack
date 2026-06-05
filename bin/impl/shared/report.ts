import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, extname, join } from "node:path";

export interface Report {
  markdown: string;
  json: unknown;
}

export interface EmitOptions {
  format: "md" | "json" | "both";
  out: string | undefined;
  defaultJsonPath: string;
}

export interface EmitResult {
  written: string[];
  stdoutUsed: boolean;
}

export function emitReport(report: Report, opts: EmitOptions): EmitResult {
  const result: EmitResult = { written: [], stdoutUsed: false };

  if (!opts.out) {
    if (opts.format === "json") {
      process.stdout.write(JSON.stringify(report.json, null, 2) + "\n");
      result.stdoutUsed = true;
    } else if (opts.format === "md") {
      process.stdout.write(endWithNewline(report.markdown));
      result.stdoutUsed = true;
    } else {
      writeAtomic(opts.defaultJsonPath, JSON.stringify(report.json, null, 2));
      result.written.push(opts.defaultJsonPath);
      process.stdout.write(endWithNewline(report.markdown));
      result.stdoutUsed = true;
    }
    return result;
  }

  const ext = extname(opts.out).toLowerCase();

  if (opts.format === "md") {
    const path = ext === ".md" ? opts.out : ext ? opts.out : opts.out + ".md";
    writeAtomic(path, report.markdown);
    result.written.push(path);
  } else if (opts.format === "json") {
    const path = ext === ".json" ? opts.out : ext ? opts.out : opts.out + ".json";
    writeAtomic(path, JSON.stringify(report.json, null, 2));
    result.written.push(path);
  } else {
    // both
    const stem = ext ? opts.out.slice(0, -ext.length) : opts.out;
    writeAtomic(stem + ".md", report.markdown);
    writeAtomic(stem + ".json", JSON.stringify(report.json, null, 2));
    result.written.push(stem + ".md", stem + ".json");
  }
  return result;
}

export function defaultReportPath(projectRoot: string, subdir: string, stem: string, ext: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return join(projectRoot, subdir, `${stem}-${date}.${ext}`);
}

function endWithNewline(s: string): string {
  return s.endsWith("\n") ? s : s + "\n";
}

function writeAtomic(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}
