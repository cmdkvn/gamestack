// TypeScript types for gamestack playtest scenarios.
// Mirrors the JSON schema documented at gamestack/skills/playtest/scenarios/README.md.
// Adding a new step primitive here REQUIRES updating that README and the 6
// reference scenarios — the schema is part of the engine-SDK contract.

export type ScenarioPhase = "prototype" | "vertical-slice" | "production" | "polish" | "cert" | "launched";

export interface Scenario {
  name: string;
  phase: ScenarioPhase;
  description: string;
  endpoint?: string;
  continue_on_failure?: boolean;
  max_duration_seconds?: number;
  setup?: Step[];
  steps: Step[];
  teardown?: Step[];
  assertions_summary?: string[];
}

export type Step =
  | WaitStep
  | WaitForStateStep
  | InputStep
  | ScreenshotStep
  | SnapshotStep
  | RestoreStep
  | BreakpointStep
  | AssertStateStep
  | AssertRecentBreakpointStep;

export interface BaseStep {
  type: string;
  step?: string;
}

export interface WaitStep extends BaseStep {
  type: "wait";
  seconds: number;
}

export interface WaitForStateStep extends BaseStep {
  type: "wait_for_state";
  tagged_key: string;
  expected_value: unknown;
  timeout_seconds: number;
}

export interface InputStep extends BaseStep {
  type: "input";
  events: InputEvent[];
}

export interface ScreenshotStep extends BaseStep {
  type: "screenshot";
  filename: string;
}

export interface SnapshotStep extends BaseStep {
  type: "snapshot";
  id?: string;
}

export interface RestoreStep extends BaseStep {
  type: "restore";
  id: string;
}

export interface BreakpointStep extends BaseStep {
  type: "breakpoint";
  action: "add-pause" | "remove-pause" | "resume" | "status";
  tag?: string;
}

export interface AssertStateStep extends BaseStep {
  type: "assert_state";
  tagged_key: string;
  expected_value?: unknown;
  expected_range?: [number, number];
}

export interface AssertRecentBreakpointStep extends BaseStep {
  type: "assert_recent_breakpoint";
  tag: string;
}

export interface InputEvent {
  device: "Keyboard" | "Mouse" | "Gamepad" | "Touch" | "Custom";
  action: "Press" | "Release" | "Value" | "Move" | "Custom";
  control: string;
  value?: number;
  x?: number;
  y?: number;
  durationSeconds?: number;
  custom?: string;
}

export type StepStatus = "ok" | "fail" | "timeout" | "skipped";

export interface StepResult {
  step: string;
  type: Step["type"];
  status: StepStatus;
  elapsed_ms: number;
  details?: Record<string, unknown>;
  screenshot?: string;
  state_after?: Record<string, unknown>;
}

export const ALL_STEP_TYPES: ReadonlyArray<Step["type"]> = [
  "wait",
  "wait_for_state",
  "input",
  "screenshot",
  "snapshot",
  "restore",
  "breakpoint",
  "assert_state",
  "assert_recent_breakpoint",
];

export function validateScenario(raw: unknown): { ok: true; scenario: Scenario } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, errors: ["scenario must be an object"] };
  }
  const s = raw as Record<string, unknown>;
  if (typeof s.name !== "string" || s.name.length === 0) errors.push("missing 'name'");
  if (typeof s.phase !== "string") errors.push("missing 'phase'");
  if (typeof s.description !== "string") errors.push("missing 'description'");
  if (!Array.isArray(s.steps)) errors.push("'steps' must be an array");

  const validateStep = (step: unknown, path: string) => {
    if (typeof step !== "object" || step === null) {
      errors.push(`${path}: step must be an object`);
      return;
    }
    const t = (step as { type?: unknown }).type;
    if (typeof t !== "string" || !ALL_STEP_TYPES.includes(t as Step["type"])) {
      errors.push(`${path}: unknown step type '${t}'. Known: ${ALL_STEP_TYPES.join(", ")}`);
    }
  };

  if (Array.isArray(s.setup)) s.setup.forEach((st, i) => validateStep(st, `setup[${i}]`));
  if (Array.isArray(s.steps)) s.steps.forEach((st, i) => validateStep(st, `steps[${i}]`));
  if (Array.isArray(s.teardown)) s.teardown.forEach((st, i) => validateStep(st, `teardown[${i}]`));

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, scenario: raw as Scenario };
}
