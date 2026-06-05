// Per-platform asset budgets, mirroring skills/asset-audit/SKILL.md.
// If the project's design/tech-design.md has overrides, the developer should
// apply them via flags (--texture-max, --audio-max-kbps, etc.) or post-process
// the JSON report. The CLI ships with the defaults.

export interface PlatformBudget {
  textureMax: number;
  totalAtlasMB: number;
  audioBitrateMinKbps: number;
  audioBitrateMaxKbps: number;
  meshTrisEnv: number;
  meshTrisChar: number;
  totalBuildMB?: number;
}

export const PLATFORM_BUDGETS: Record<string, PlatformBudget> = {
  "pc-hi": {
    textureMax: 4096,
    totalAtlasMB: 1024,
    audioBitrateMinKbps: 192,
    audioBitrateMaxKbps: 320,
    meshTrisEnv: 100_000,
    meshTrisChar: 20_000,
  },
  "pc-mid": {
    textureMax: 2048,
    totalAtlasMB: 512,
    audioBitrateMinKbps: 128,
    audioBitrateMaxKbps: 192,
    meshTrisEnv: 50_000,
    meshTrisChar: 10_000,
  },
  "switch-handheld": {
    textureMax: 1024,
    totalAtlasMB: 256,
    audioBitrateMinKbps: 96,
    audioBitrateMaxKbps: 192,
    meshTrisEnv: 20_000,
    meshTrisChar: 8_000,
  },
  "switch-docked": {
    textureMax: 1024,
    totalAtlasMB: 256,
    audioBitrateMinKbps: 96,
    audioBitrateMaxKbps: 192,
    meshTrisEnv: 30_000,
    meshTrisChar: 10_000,
  },
  "ps5": {
    textureMax: 4096,
    totalAtlasMB: 2048,
    audioBitrateMinKbps: 192,
    audioBitrateMaxKbps: 320,
    meshTrisEnv: 200_000,
    meshTrisChar: 30_000,
  },
  "xbox-series-x": {
    textureMax: 4096,
    totalAtlasMB: 2048,
    audioBitrateMinKbps: 192,
    audioBitrateMaxKbps: 320,
    meshTrisEnv: 200_000,
    meshTrisChar: 30_000,
  },
  "mobile-hi": {
    textureMax: 1024,
    totalAtlasMB: 256,
    audioBitrateMinKbps: 64,
    audioBitrateMaxKbps: 128,
    meshTrisEnv: 30_000,
    meshTrisChar: 8_000,
  },
  "mobile-lo": {
    textureMax: 512,
    totalAtlasMB: 128,
    audioBitrateMinKbps: 64,
    audioBitrateMaxKbps: 128,
    meshTrisEnv: 15_000,
    meshTrisChar: 5_000,
  },
  "web": {
    textureMax: 512,
    totalAtlasMB: 50,
    audioBitrateMinKbps: 64,
    audioBitrateMaxKbps: 96,
    meshTrisEnv: 10_000,
    meshTrisChar: 4_000,
    totalBuildMB: 50,
  },
};

export const PLATFORM_ALIASES: Record<string, string> = {
  "pc": "pc-mid",
  "steam": "pc-hi",
  "switch": "switch-handheld",
  "xbox": "xbox-series-x",
  "xboxsx": "xbox-series-x",
  "mobile": "mobile-hi",
  "ios": "mobile-hi",
  "android": "mobile-hi",
  "itch": "web",
};

export function listPlatforms(): string[] {
  return Object.keys(PLATFORM_BUDGETS);
}

export function listAliases(): Record<string, string> {
  return { ...PLATFORM_ALIASES };
}

export function resolvePlatform(name: string): { key: string; budget: PlatformBudget } | null {
  const lower = name.toLowerCase();
  if (PLATFORM_BUDGETS[lower]) return { key: lower, budget: PLATFORM_BUDGETS[lower]! };
  const aliased = PLATFORM_ALIASES[lower];
  if (aliased && PLATFORM_BUDGETS[aliased]) return { key: aliased, budget: PLATFORM_BUDGETS[aliased]! };
  return null;
}
