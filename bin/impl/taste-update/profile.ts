import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export interface TasteProfile {
  version: 1;
  updatedAt: string;
  rounds: RoundLog[];
  preferences: {
    byAxis: Record<string, Record<string, AxisStat>>;
    negativePatterns: string[];
  };
  emergingSignals: string[];
}

export interface RoundLog {
  subject: string;
  round?: number;
  date: string;
  variants: VariantOutcome[];
}

export interface VariantOutcome {
  variant: string;
  axisVaried: string;
  axisValue: string;
  outcome: "KEEP" | "DISCARD" | "MIX_IN";
  confidence?: "high" | "medium" | "low";
  notes?: string;
}

export interface AxisStat {
  wins: number;
  losses: number;
  lastUpdated: string;
}

export interface ApprovalEvent {
  subject: string;
  round?: number;
  date?: string;
  variant: string;
  axisVaried: string;
  axisValue: string;
  outcome: "KEEP" | "DISCARD" | "MIX_IN";
  confidence?: "high" | "medium" | "low";
  notes?: string;
}

const SIGNAL_THRESHOLD_TOTAL = 4;
const SIGNAL_THRESHOLD_WIN_RATE = 0.7;

export function loadProfile(path: string): TasteProfile {
  if (!existsSync(path)) {
    return emptyProfile();
  }
  try {
    const data = JSON.parse(readFileSync(path, "utf8"));
    if (data && typeof data === "object" && data.version === 1) {
      return migrate(data as Partial<TasteProfile>);
    }
    return emptyProfile();
  } catch {
    return emptyProfile();
  }
}

export function saveProfile(path: string, profile: TasteProfile): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(profile, null, 2));
}

export function emptyProfile(): TasteProfile {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    rounds: [],
    preferences: { byAxis: {}, negativePatterns: [] },
    emergingSignals: [],
  };
}

function migrate(partial: Partial<TasteProfile>): TasteProfile {
  return {
    version: 1,
    updatedAt: partial.updatedAt ?? new Date().toISOString(),
    rounds: partial.rounds ?? [],
    preferences: {
      byAxis: partial.preferences?.byAxis ?? {},
      negativePatterns: partial.preferences?.negativePatterns ?? [],
    },
    emergingSignals: partial.emergingSignals ?? [],
  };
}

export function recordEvents(profile: TasteProfile, events: ApprovalEvent[]): TasteProfile {
  const now = new Date().toISOString();
  const next: TasteProfile = JSON.parse(JSON.stringify(profile));

  for (const e of events) {
    const date = e.date ?? new Date().toISOString().slice(0, 10);
    const round = ensureRound(next, e.subject, date, e.round);
    round.variants.push({
      variant: e.variant,
      axisVaried: e.axisVaried,
      axisValue: e.axisValue,
      outcome: e.outcome,
      confidence: e.confidence,
      notes: e.notes,
    });

    if (!next.preferences.byAxis[e.axisVaried]) {
      next.preferences.byAxis[e.axisVaried] = {};
    }
    const stat = next.preferences.byAxis[e.axisVaried]![e.axisValue] ?? {
      wins: 0,
      losses: 0,
      lastUpdated: now,
    };
    if (e.outcome === "KEEP") stat.wins += 1;
    else if (e.outcome === "DISCARD") stat.losses += 1;
    else if (e.outcome === "MIX_IN") stat.wins += 0.5;
    stat.lastUpdated = now;
    next.preferences.byAxis[e.axisVaried]![e.axisValue] = stat;
  }

  next.emergingSignals = computeSignals(next);
  next.updatedAt = now;
  return next;
}

function ensureRound(profile: TasteProfile, subject: string, date: string, round: number | undefined): RoundLog {
  let last = profile.rounds[profile.rounds.length - 1];
  const matches =
    last && last.subject === subject && last.date === date && (round === undefined || last.round === round);
  if (matches) return last!;
  const fresh: RoundLog = { subject, date, round, variants: [] };
  profile.rounds.push(fresh);
  return fresh;
}

export function applyDecay(profile: TasteProfile, opts: { halfLifeDays?: number; now?: Date } = {}): TasteProfile {
  const halfLife = opts.halfLifeDays ?? 90;
  const now = opts.now ?? new Date();
  const next: TasteProfile = JSON.parse(JSON.stringify(profile));

  for (const axis of Object.keys(next.preferences.byAxis)) {
    const bucket = next.preferences.byAxis[axis]!;
    for (const value of Object.keys(bucket)) {
      const stat = bucket[value]!;
      const updated = new Date(stat.lastUpdated);
      const ageDays = (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24);
      const factor = Math.pow(0.5, ageDays / halfLife);
      stat.wins = round3(stat.wins * factor);
      stat.losses = round3(stat.losses * factor);
      stat.lastUpdated = now.toISOString();
    }
  }
  next.updatedAt = now.toISOString();
  next.emergingSignals = computeSignals(next);
  return next;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

export function computeSignals(profile: TasteProfile): string[] {
  const signals: string[] = [];
  for (const [axis, values] of Object.entries(profile.preferences.byAxis)) {
    const ranked = Object.entries(values)
      .map(([value, stat]) => {
        const total = stat.wins + stat.losses;
        const winRate = total > 0 ? stat.wins / total : 0;
        return { axis, value, total, winRate, stat };
      })
      .filter((r) => r.total >= SIGNAL_THRESHOLD_TOTAL)
      .sort((a, b) => b.winRate - a.winRate);
    if (ranked.length === 0) continue;
    const top = ranked[0]!;
    if (top.winRate >= SIGNAL_THRESHOLD_WIN_RATE) {
      const second = ranked[1];
      const gap = second ? top.winRate - second.winRate : top.winRate;
      signals.push(
        `${axis}: '${top.value}' wins (${(top.winRate * 100).toFixed(0)}% over ${top.total} samples${
          gap >= 0.2 ? `, leads next by ${(gap * 100).toFixed(0)}%` : ""
        })`,
      );
    }
  }
  return signals;
}

export function readEvents(path: string): ApprovalEvent[] {
  const text = readFileSync(path, "utf8").trim();
  if (!text) return [];
  if (text.startsWith("[")) {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) throw new Error("--events file: expected an array or NDJSON lines");
    return parsed.map(validateEvent);
  }
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 1) {
    return [validateEvent(JSON.parse(lines[0]!))];
  }
  return lines.map((line) => validateEvent(JSON.parse(line)));
}

function validateEvent(raw: unknown): ApprovalEvent {
  if (typeof raw !== "object" || raw === null) throw new Error("approval event must be an object");
  const e = raw as Record<string, unknown>;
  const required = ["subject", "variant", "axisVaried", "axisValue", "outcome"] as const;
  for (const k of required) {
    if (typeof e[k] !== "string") throw new Error(`approval event missing string '${k}'`);
  }
  const outcome = e.outcome as string;
  if (!["KEEP", "DISCARD", "MIX_IN"].includes(outcome)) {
    throw new Error(`outcome must be KEEP | DISCARD | MIX_IN (got '${outcome}')`);
  }
  return {
    subject: e.subject as string,
    round: typeof e.round === "number" ? e.round : undefined,
    date: typeof e.date === "string" ? e.date : undefined,
    variant: e.variant as string,
    axisVaried: e.axisVaried as string,
    axisValue: e.axisValue as string,
    outcome: outcome as ApprovalEvent["outcome"],
    confidence: typeof e.confidence === "string" ? (e.confidence as ApprovalEvent["confidence"]) : undefined,
    notes: typeof e.notes === "string" ? e.notes : undefined,
  };
}
