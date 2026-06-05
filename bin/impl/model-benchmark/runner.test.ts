import { describe, test, expect } from "bun:test";
import { evaluate, runSuite } from "./runner.ts";
import { renderMarkdown } from "./render.ts";
import { validateSuite, type ChatClient, type ChatRequest, type ChatResponse, type Suite } from "./types.ts";

class StaticClient implements ChatClient {
  constructor(private responses: Map<string, ChatResponse>) {}
  async send(req: ChatRequest): Promise<ChatResponse> {
    const key = `${req.model}::${req.prompt}`;
    const r = this.responses.get(key);
    if (!r) throw new Error(`StaticClient: no response registered for ${key}`);
    return r;
  }
}

class ThrowingClient implements ChatClient {
  async send(): Promise<ChatResponse> {
    throw new Error("simulated API failure");
  }
}

function resp(text: string, latency = 100, outputTokens = 80): ChatResponse {
  return { text, inputTokens: 50, outputTokens, latencyMs: latency, stopReason: "end_turn" };
}

describe("evaluate", () => {
  test("contains checks (case-insensitive)", () => {
    const checks = evaluate("ATLAS your textures and use BC7 compression.", {
      contains: ["atlas", "compression"],
    });
    expect(checks.every((c) => c.passed)).toBe(true);
  });

  test("notContains catches forbidden words", () => {
    const checks = evaluate("Just slap on some mipmaps. lol.", {
      notContains: ["lol"],
    });
    expect(checks[0]!.passed).toBe(false);
  });

  test("matches and notMatches via regex", () => {
    const checks = evaluate("FPS = 60, frametime = 16.6ms", {
      matches: [{ pattern: "FPS\\s*=\\s*\\d+" }],
      notMatches: [{ pattern: "TODO" }],
    });
    expect(checks.every((c) => c.passed)).toBe(true);
  });

  test("word count window", () => {
    const five = "one two three four five";
    const checks = evaluate(five, { wordCountMin: 6, wordCountMax: 10 });
    expect(checks[0]!.passed).toBe(false); // below min
    expect(checks[1]!.passed).toBe(true);  // within max
  });
});

describe("runSuite", () => {
  const suite: Suite = {
    name: "test-suite",
    description: "tiny",
    models: ["claude-opus-4-7", "claude-sonnet-4-6"],
    maxTokens: 256,
    cases: [
      {
        id: "asset-audit",
        prompt: "How would you audit assets?",
        expected: { contains: ["atlas"] },
      },
      {
        id: "cert-readiness",
        prompt: "What are PS5 cert pitfalls?",
        expected: { contains: ["sleep"], notContains: ["NDA"] },
      },
    ],
  };

  test("happy path: all pass; winner picked by pass rate", async () => {
    const responses = new Map<string, ChatResponse>([
      ["claude-opus-4-7::How would you audit assets?", resp("Atlas the textures; use BC7.", 100)],
      ["claude-opus-4-7::What are PS5 cert pitfalls?", resp("Sleep/resume across every state.", 100)],
      ["claude-sonnet-4-6::How would you audit assets?", resp("Atlas first.", 60)],
      ["claude-sonnet-4-6::What are PS5 cert pitfalls?", resp("Sleep matters.", 60)],
    ]);
    const report = await runSuite(suite, new StaticClient(responses));
    expect(report.results.length).toBe(4);
    expect(report.summaries.every((s) => s.passRate === 1)).toBe(true);
    // Tied pass rate → faster model wins.
    expect(report.winner).toBe("claude-sonnet-4-6");
  });

  test("API failure marks the case as failed with note", async () => {
    const report = await runSuite(suite, new ThrowingClient());
    expect(report.results.every((r) => !r.passed)).toBe(true);
    expect(report.notes.length).toBeGreaterThan(0);
    expect(report.notes[0]).toContain("simulated API failure");
  });

  test("winner picks the higher-pass-rate model even if slower", async () => {
    const responses = new Map<string, ChatResponse>([
      ["claude-opus-4-7::How would you audit assets?", resp("Atlas these.", 500)],
      ["claude-opus-4-7::What are PS5 cert pitfalls?", resp("Sleep/resume.", 500)],
      ["claude-sonnet-4-6::How would you audit assets?", resp("No idea.", 50)], // misses 'atlas'
      ["claude-sonnet-4-6::What are PS5 cert pitfalls?", resp("Sleep.", 50)],
    ]);
    const report = await runSuite(suite, new StaticClient(responses));
    expect(report.winner).toBe("claude-opus-4-7");
  });

  test("renderMarkdown includes summary + per-case sections", async () => {
    const responses = new Map<string, ChatResponse>([
      ["claude-opus-4-7::How would you audit assets?", resp("Atlas.", 90)],
      ["claude-opus-4-7::What are PS5 cert pitfalls?", resp("Sleep.", 90)],
      ["claude-sonnet-4-6::How would you audit assets?", resp("Atlas.", 50)],
      ["claude-sonnet-4-6::What are PS5 cert pitfalls?", resp("Sleep.", 50)],
    ]);
    const report = await runSuite(suite, new StaticClient(responses));
    const md = renderMarkdown(report);
    expect(md).toContain("# Model benchmark");
    expect(md).toContain("## Summary");
    expect(md).toContain("## Per-case results");
    expect(md).toContain("Winner");
  });
});

describe("validateSuite", () => {
  test("accepts a well-formed suite", () => {
    const r = validateSuite({
      name: "x",
      models: ["a", "b"],
      cases: [{ id: "c1", prompt: "p" }],
    });
    expect(r.ok).toBe(true);
  });

  test("rejects missing fields", () => {
    const r = validateSuite({ name: "x" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.length).toBeGreaterThan(0);
    }
  });

  test("rejects empty models / cases", () => {
    const r = validateSuite({ name: "x", models: [], cases: [{ id: "c", prompt: "p" }] });
    expect(r.ok).toBe(false);
  });

  test("rejects malformed case", () => {
    const r = validateSuite({
      name: "x",
      models: ["a"],
      cases: [{ id: 123, prompt: "p" }],
    });
    expect(r.ok).toBe(false);
  });
});
