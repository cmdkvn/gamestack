// Cross-model prompt benchmarking — suite + result types.

export interface Suite {
  name: string;
  description?: string;
  models: string[];
  maxTokens?: number;
  cases: SuiteCase[];
}

export interface SuiteCase {
  id: string;
  system?: string;
  prompt: string;
  /** Optional turn history. If set, the runner sends these as prior messages. */
  history?: { role: "user" | "assistant"; content: string }[];
  expected?: Expectation;
  notes?: string;
}

export interface Expectation {
  contains?: string[];                 // substrings (case-insensitive) that must appear
  notContains?: string[];              // substrings that must NOT appear
  matches?: RegexEntry[];              // regex matches
  notMatches?: RegexEntry[];           // regex non-matches
  wordCountMin?: number;
  wordCountMax?: number;
  /** Free-form taxonomic tags — pass them through for the report. */
  tags?: string[];
}

export interface RegexEntry {
  pattern: string;
  flags?: string;
}

export interface ChatRequest {
  model: string;
  system?: string;
  prompt: string;
  history?: { role: "user" | "assistant"; content: string }[];
  maxTokens: number;
  cacheSystem?: boolean;
}

export interface ChatResponse {
  text: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens?: number;
  cacheCreationInputTokens?: number;
  latencyMs: number;
  stopReason?: string;
}

export interface ChatClient {
  send(req: ChatRequest): Promise<ChatResponse>;
}

export interface CaseResult {
  caseId: string;
  model: string;
  text: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  checks: CheckResult[];
  passed: boolean;
}

export interface CheckResult {
  name: string;
  passed: boolean;
  detail?: string;
}

export interface ModelSummary {
  model: string;
  totalCases: number;
  passed: number;
  passRate: number;
  meanLatencyMs: number;
  p99LatencyMs: number;
  meanOutputTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
}

export interface BenchmarkReport {
  generatedAt: string;
  suite: { name: string; description?: string };
  models: string[];
  cases: number;
  results: CaseResult[];
  summaries: ModelSummary[];
  winner: string | null;
  notes: string[];
}

export function validateSuite(raw: unknown): { ok: true; suite: Suite } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, errors: ["suite must be an object"] };
  }
  const s = raw as Record<string, unknown>;
  if (typeof s.name !== "string") errors.push("missing 'name'");
  if (!Array.isArray(s.models) || s.models.length === 0) errors.push("'models' must be a non-empty array");
  if (!Array.isArray(s.cases) || s.cases.length === 0) errors.push("'cases' must be a non-empty array");
  if (Array.isArray(s.cases)) {
    s.cases.forEach((c, i) => {
      if (typeof c !== "object" || c === null) errors.push(`cases[${i}] must be an object`);
      else {
        const cc = c as Record<string, unknown>;
        if (typeof cc.id !== "string") errors.push(`cases[${i}].id must be a string`);
        if (typeof cc.prompt !== "string") errors.push(`cases[${i}].prompt must be a string`);
      }
    });
  }
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, suite: raw as Suite };
}
