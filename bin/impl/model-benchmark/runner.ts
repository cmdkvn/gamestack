import { isoDate } from "../shared/format.ts";
import type {
  BenchmarkReport,
  CaseResult,
  ChatClient,
  CheckResult,
  Expectation,
  ModelSummary,
  Suite,
  SuiteCase,
} from "./types.ts";

export interface RunOptions {
  cacheSystem?: boolean;
  defaultMaxTokens?: number;
  /** Optional per-case callback for progress reporting. */
  onCase?: (caseId: string, model: string, passed: boolean) => void;
}

export async function runSuite(suite: Suite, client: ChatClient, opts: RunOptions = {}): Promise<BenchmarkReport> {
  const results: CaseResult[] = [];
  const notes: string[] = [];

  for (const model of suite.models) {
    for (const c of suite.cases) {
      const maxTokens = suite.maxTokens ?? opts.defaultMaxTokens ?? 1024;
      let response;
      try {
        response = await client.send({
          model,
          system: c.system,
          prompt: c.prompt,
          history: c.history,
          maxTokens,
          cacheSystem: opts.cacheSystem,
        });
      } catch (err) {
        notes.push(`${model} / ${c.id}: ${(err as Error).message}`);
        results.push({
          caseId: c.id,
          model,
          text: "",
          inputTokens: 0,
          outputTokens: 0,
          latencyMs: 0,
          checks: [{ name: "request", passed: false, detail: (err as Error).message }],
          passed: false,
        });
        opts.onCase?.(c.id, model, false);
        continue;
      }

      const checks = evaluate(response.text, c.expected);
      const passed = checks.length === 0 || checks.every((c) => c.passed);
      results.push({
        caseId: c.id,
        model,
        text: response.text,
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
        latencyMs: response.latencyMs,
        checks,
        passed,
      });
      opts.onCase?.(c.id, model, passed);
    }
  }

  const summaries = summarize(suite.models, results);
  const winner = pickWinner(summaries);

  return {
    generatedAt: isoDate(),
    suite: { name: suite.name, description: suite.description },
    models: suite.models,
    cases: suite.cases.length,
    results,
    summaries,
    winner,
    notes,
  };
}

export function evaluate(text: string, expected: SuiteCase["expected"]): CheckResult[] {
  if (!expected) return [];
  const checks: CheckResult[] = [];
  const lower = text.toLowerCase();

  for (const sub of expected.contains ?? []) {
    checks.push({
      name: `contains '${sub}'`,
      passed: lower.includes(sub.toLowerCase()),
    });
  }
  for (const sub of expected.notContains ?? []) {
    checks.push({
      name: `does NOT contain '${sub}'`,
      passed: !lower.includes(sub.toLowerCase()),
    });
  }
  for (const re of expected.matches ?? []) {
    try {
      const r = new RegExp(re.pattern, re.flags ?? "i");
      checks.push({ name: `matches /${re.pattern}/${re.flags ?? ""}`, passed: r.test(text) });
    } catch (err) {
      checks.push({ name: `matches /${re.pattern}/`, passed: false, detail: `invalid regex: ${(err as Error).message}` });
    }
  }
  for (const re of expected.notMatches ?? []) {
    try {
      const r = new RegExp(re.pattern, re.flags ?? "i");
      checks.push({ name: `does NOT match /${re.pattern}/${re.flags ?? ""}`, passed: !r.test(text) });
    } catch (err) {
      checks.push({ name: `does NOT match /${re.pattern}/`, passed: false, detail: `invalid regex: ${(err as Error).message}` });
    }
  }

  const words = text.trim().split(/\s+/).filter((w) => w.length > 0);
  if (typeof expected.wordCountMin === "number") {
    checks.push({
      name: `word count >= ${expected.wordCountMin}`,
      passed: words.length >= expected.wordCountMin,
      detail: `${words.length} words`,
    });
  }
  if (typeof expected.wordCountMax === "number") {
    checks.push({
      name: `word count <= ${expected.wordCountMax}`,
      passed: words.length <= expected.wordCountMax,
      detail: `${words.length} words`,
    });
  }
  return checks;
}

function summarize(models: string[], results: CaseResult[]): ModelSummary[] {
  return models.map((model) => {
    const subset = results.filter((r) => r.model === model);
    const passed = subset.filter((r) => r.passed).length;
    const latencies = subset.map((r) => r.latencyMs).sort((a, b) => a - b);
    const inputTokens = subset.reduce((a, r) => a + r.inputTokens, 0);
    const outputTokens = subset.reduce((a, r) => a + r.outputTokens, 0);
    const meanLatency = subset.length > 0 ? latencies.reduce((a, b) => a + b, 0) / subset.length : 0;
    const p99 = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.99)] ?? latencies[latencies.length - 1]! : 0;
    const meanOutput = subset.length > 0 ? outputTokens / subset.length : 0;
    return {
      model,
      totalCases: subset.length,
      passed,
      passRate: subset.length > 0 ? passed / subset.length : 0,
      meanLatencyMs: Math.round(meanLatency),
      p99LatencyMs: Math.round(p99),
      meanOutputTokens: Math.round(meanOutput),
      totalInputTokens: inputTokens,
      totalOutputTokens: outputTokens,
    };
  });
}

function pickWinner(summaries: ModelSummary[]): string | null {
  if (summaries.length === 0) return null;
  let best = summaries[0]!;
  for (const s of summaries.slice(1)) {
    if (s.passRate > best.passRate) {
      best = s;
    } else if (Math.abs(s.passRate - best.passRate) < 0.01 && s.meanLatencyMs < best.meanLatencyMs) {
      best = s;
    }
  }
  return best.model;
}
