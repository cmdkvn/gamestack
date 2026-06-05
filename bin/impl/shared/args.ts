export interface ParsedArgv {
  has(name: string): boolean;
  get(name: string): string | undefined;
  positional: string[];
}

const ALWAYS_BOOLEAN = new Set(["help", "h", "version", "v"]);

export function parseArgv(argv: string[], extraBooleanFlags: string[] = []): ParsedArgv {
  const booleanFlags = new Set([...ALWAYS_BOOLEAN, ...extraBooleanFlags]);
  const values = new Map<string, string | true>();
  const positional: string[] = [];

  let i = 0;
  while (i < argv.length) {
    const arg = argv[i]!;
    if (arg === "--") {
      for (let j = i + 1; j < argv.length; j++) positional.push(argv[j]!);
      break;
    }
    if (arg.startsWith("--")) {
      const eqIdx = arg.indexOf("=");
      const key = eqIdx >= 0 ? arg.slice(2, eqIdx) : arg.slice(2);
      if (eqIdx >= 0) {
        values.set(key, arg.slice(eqIdx + 1));
        i++;
        continue;
      }
      if (booleanFlags.has(key)) {
        values.set(key, true);
        i++;
        continue;
      }
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("-")) {
        values.set(key, true);
        i++;
      } else {
        values.set(key, next);
        i += 2;
      }
    } else if (arg.startsWith("-") && arg.length === 2) {
      values.set(arg.slice(1), true);
      i++;
    } else {
      positional.push(arg);
      i++;
    }
  }

  return {
    has: (name) => values.has(name),
    get: (name) => {
      const v = values.get(name);
      return typeof v === "string" ? v : undefined;
    },
    positional,
  };
}

export interface CommonOptions {
  project: string;
  format: "md" | "json" | "both";
  out: string | undefined;
  showHelp: boolean;
  showVersion: boolean;
}

export function parseCommonOptions(argv: ParsedArgv, defaults: { defaultProject?: string } = {}): CommonOptions {
  const formatRaw = argv.get("format") ?? "md";
  if (formatRaw !== "md" && formatRaw !== "json" && formatRaw !== "both") {
    throw new ArgError(`--format must be md | json | both (got '${formatRaw}')`);
  }
  return {
    project: argv.get("project") ?? defaults.defaultProject ?? process.cwd(),
    format: formatRaw,
    out: argv.get("out"),
    showHelp: argv.has("help") || argv.has("h"),
    showVersion: argv.has("version") || argv.has("v"),
  };
}

export class ArgError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ArgError";
  }
}
