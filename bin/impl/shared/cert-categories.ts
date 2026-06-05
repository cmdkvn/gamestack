// Cert checklist categories per platform, mirroring skills/cert-readiness/SKILL.md.
//
// IMPORTANT: this is NOT a substitute for the NDA-protected TRC / TCR / lotcheck.
// The categories below cover the high-failure-rate items only. The CLI surfaces
// a reminder at the top of every report.

export type Verdict =
  | "PASS"
  | "PASS_CODE_ONLY"
  | "NEEDS_LIVE_TEST"
  | "FAIL_P0"
  | "FAIL_P1"
  | "NOT_APPLICABLE";

export interface CertCategory {
  id: string;
  name: string;
  whatCertTests: string;
  /** Regex patterns whose presence in scripts indicates the area is implemented. */
  codePatterns?: RegExp[];
  /** Project-relative file paths whose presence indicates the area is configured. */
  configMarkers?: string[];
  /** Playtest scenario filenames that exercise this category. */
  playtestScenarios?: string[];
  /** Verdict when nothing was found. */
  defaultIfMissing: Verdict;
  /** True if no amount of static analysis can give a PASS — always needs live test. */
  alwaysNeedsLiveTest?: boolean;
  notes?: string;
}

export type Platform = "ps5" | "xbox" | "switch";

// Common code patterns reused across categories.
const SAVE_ATOMIC = [
  /WriteAllBytes\(/i,
  /File\.Replace\s*\(/,
  /\.tmp"\s*,/,
  /AtomicWrite/i,
  /tempPath.*?Replace/is,
];

const CONTROLLER_DISCONNECT = [
  /InputUser\.onChange/,
  /onDeviceConnectionChanged/,
  /OnDevicePaired/,
  /JoyconConnect/i,
  /controller.?disconnect/i,
];

const SLEEP_RESUME = [
  /OnApplicationPause/,
  /OnApplicationFocus/,
  /Application\.focusChanged/,
  /SystemEvents\.PowerModeChanged/,
  /SuspendResume/i,
];

const SUBTITLES = [
  /subtitle/i,
  /SubtitleManager/i,
  /CaptionTrack/i,
  /[Cc]losed[Cc]aption/,
];

const REMAPPABLE_INPUT = [
  /InputBindingComposite/,
  /RebindingOperation/,
  /KeyRemap/i,
  /control.*remap/i,
];

export const PS5_CATEGORIES: CertCategory[] = [
  {
    id: "memory",
    name: "Memory management",
    whatCertTests: "No leaks during long sessions, no OOM on platform-set memory cap",
    alwaysNeedsLiveTest: true,
    defaultIfMissing: "NEEDS_LIVE_TEST",
    notes: "Run a 4-hour soak test on the dev kit before submission.",
  },
  {
    id: "psn",
    name: "PSN integration",
    whatCertTests: "Sign-in, sign-out, Friends, Messages from in-game",
    codePatterns: [/PsnSignIn/i, /Sce\w+UserService/i, /\bPSN\b/, /\bPlayStationNetwork\b/i],
    defaultIfMissing: "FAIL_P1",
  },
  {
    id: "trophy",
    name: "Trophy implementation",
    whatCertTests: "Full set including platinum if structure permits; unlock persists offline, syncs online",
    codePatterns: [/Trophy/i, /TrophyUnlock/i, /SceTrophy/i],
    configMarkers: ["docs/cert/ps5-trophies.md", "ProjectSettings/PS5/trophies.xml"],
    defaultIfMissing: "FAIL_P1",
    notes: "If the design has any '100% complete' notion, a platinum is expected.",
  },
  {
    id: "dualsense",
    name: "DualSense usage",
    whatCertTests: "Haptics + adaptive triggers used meaningfully (not just default rumble)",
    codePatterns: [/DualSense/i, /AdaptiveTrigger/i, /[Hh]aptic[A-Z]/, /SetTriggerEffect/i],
    defaultIfMissing: "FAIL_P1",
    notes: "Default rumble on hit is not enough — cert tests for meaningful use.",
  },
  {
    id: "sleep-resume",
    name: "Sleep / resume",
    whatCertTests: "Game survives suspend during every state: gameplay, menus, cutscenes, loading",
    codePatterns: SLEEP_RESUME,
    playtestScenarios: ["04-cert-controller-disconnect.json", "05-cert-save-fuzz.json"],
    defaultIfMissing: "NEEDS_LIVE_TEST",
  },
  {
    id: "controller-disconnect",
    name: "Controller disconnect",
    whatCertTests: "Game pauses gracefully; reconnect resumes cleanly",
    codePatterns: CONTROLLER_DISCONNECT,
    playtestScenarios: ["04-cert-controller-disconnect.json"],
    defaultIfMissing: "NEEDS_LIVE_TEST",
  },
  {
    id: "save-integrity",
    name: "Save data integrity",
    whatCertTests: "Atomic writes survive power loss; no corruption under contention",
    codePatterns: SAVE_ATOMIC,
    playtestScenarios: ["05-cert-save-fuzz.json"],
    defaultIfMissing: "FAIL_P1",
  },
  {
    id: "cross-region-pricing",
    name: "Cross-region pricing",
    whatCertTests: "All listed regions have prices and ratings set",
    alwaysNeedsLiveTest: true,
    defaultIfMissing: "NEEDS_LIVE_TEST",
    notes: "Verify in PartnerNet, not in code.",
  },
];

export const XBOX_CATEGORIES: CertCategory[] = [
  {
    id: "achievements",
    name: "Achievement implementation",
    whatCertTests: "Full set; unlocks fire correctly; persist offline; sync online",
    codePatterns: [/Achievement/i, /XboxLive/i, /\bGS\.SetAchievement/i, /XblAchievement/i],
    defaultIfMissing: "FAIL_P1",
  },
  {
    id: "profile-switching",
    name: "Profile switching",
    whatCertTests: "Mid-session profile switch handled without crash or save corruption",
    codePatterns: [/onSignInChanged/i, /XUserChanged/i, /ProfileSwitch/i],
    defaultIfMissing: "FAIL_P1",
  },
  {
    id: "quick-resume",
    name: "Quick Resume",
    whatCertTests: "Game restores arbitrary state without explicit save — Xbox-unique gate",
    codePatterns: [...SAVE_ATOMIC, /QuickResume/i, /OnSuspending/i, /OnResuming/i],
    playtestScenarios: ["05-cert-save-fuzz.json"],
    defaultIfMissing: "FAIL_P0",
    notes: "Quick Resume failures are usually save-system bugs in disguise. Save-fuzz scenario covers it.",
  },
  {
    id: "cloud-saves",
    name: "Cloud saves",
    whatCertTests: "Round-trip via Connected Storage; conflict resolution implemented",
    codePatterns: [/ConnectedStorage/i, /CloudSave/i, /XblCloud/i],
    defaultIfMissing: "FAIL_P1",
  },
  {
    id: "accessibility",
    name: "Accessibility",
    whatCertTests: "Subtitles default ON; remappable controls; visual representation of audio — Xbox is the strictest of the three",
    codePatterns: [...SUBTITLES, ...REMAPPABLE_INPUT],
    configMarkers: ["docs/a11y/checklist.md", "Assets/Resources/Accessibility.asset"],
    defaultIfMissing: "FAIL_P0",
    notes: "ID@Xbox publishes a recommended list — match it.",
  },
  {
    id: "game-bar-capture",
    name: "Microsoft Game Bar / Capture",
    whatCertTests: "Game allows recording where required; no rejection of capture overlay",
    codePatterns: [/AppCapture/i, /BroadcastService/i, /GameBar/i],
    defaultIfMissing: "NEEDS_LIVE_TEST",
  },
  {
    id: "hdr",
    name: "HDR / Auto HDR",
    whatCertTests: "If used, no visual artifacts; falls back cleanly on non-HDR displays",
    codePatterns: [/HDR/, /HighDynamicRange/, /[Tt]oneMap/],
    defaultIfMissing: "NOT_APPLICABLE",
    notes: "Only fails cert if HDR is enabled.",
  },
  {
    id: "sign-in-out",
    name: "Sign-in / sign-out",
    whatCertTests: "Handled mid-session without losing state",
    codePatterns: [/SignIn/i, /SignOut/i, /XUserAddAsync/i],
    defaultIfMissing: "NEEDS_LIVE_TEST",
  },
];

export const SWITCH_CATEGORIES: CertCategory[] = [
  {
    id: "controller-modes",
    name: "Controller modes",
    whatCertTests: "Handheld, tabletop (split Joy-Con), Pro Controller — all work; right glyphs shown",
    codePatterns: [/JoyCon/i, /HandheldMode/i, /ProController/i, /\bnpad\b/i, /SplitMode/i],
    defaultIfMissing: "FAIL_P1",
  },
  {
    id: "sleep-resume",
    name: "Sleep / resume",
    whatCertTests: "Lotcheck's most-failed item. Test by suspending during every state.",
    codePatterns: SLEEP_RESUME,
    playtestScenarios: ["04-cert-controller-disconnect.json", "05-cert-save-fuzz.json"],
    defaultIfMissing: "FAIL_P0",
    notes: "Switch lotcheck's most-failed item. Test home-button during every game state.",
  },
  {
    id: "parental-controls",
    name: "Parental controls",
    whatCertTests: "Game respects platform-set parental limits (rating gates, web access, communication)",
    codePatterns: [/ParentalControl/i, /\bnn::oe::Restrict/i],
    defaultIfMissing: "FAIL_P1",
  },
  {
    id: "suspend-during-write",
    name: "Suspend during write",
    whatCertTests: "Save mid-write survives suspend without corruption",
    codePatterns: SAVE_ATOMIC,
    playtestScenarios: ["05-cert-save-fuzz.json"],
    defaultIfMissing: "FAIL_P0",
  },
  {
    id: "memory-ceiling",
    name: "Memory ceiling",
    whatCertTests: "Fits in 4 GB handheld budget with OS reservation",
    alwaysNeedsLiveTest: true,
    defaultIfMissing: "NEEDS_LIVE_TEST",
  },
  {
    id: "boot-time",
    name: "Boot time",
    whatCertTests: "Under platform threshold (typically < 30 s cold start)",
    alwaysNeedsLiveTest: true,
    defaultIfMissing: "NEEDS_LIVE_TEST",
  },
  {
    id: "localization",
    name: "Localization",
    whatCertTests: "All shown strings localized for every shipped language; no clipping at long-language widths",
    configMarkers: ["Assets/Locale", "Assets/i18n", "locale", "i18n", "Localization"],
    defaultIfMissing: "FAIL_P1",
  },
  {
    id: "age-rating-consistency",
    name: "Age rating consistency",
    whatCertTests: "Same rating shown in eShop, in-game splash, parental control panel",
    alwaysNeedsLiveTest: true,
    defaultIfMissing: "NEEDS_LIVE_TEST",
  },
];

export function categoriesFor(platform: Platform): CertCategory[] {
  switch (platform) {
    case "ps5":
      return PS5_CATEGORIES;
    case "xbox":
      return XBOX_CATEGORIES;
    case "switch":
      return SWITCH_CATEGORIES;
  }
}

export function platformDisplayName(platform: Platform): string {
  switch (platform) {
    case "ps5":
      return "PS5";
    case "xbox":
      return "Xbox";
    case "switch":
      return "Switch";
  }
}

export function checklistVersionGlob(platform: Platform): string {
  switch (platform) {
    case "ps5":
      return "docs/cert/ps5-trc-v*.{pdf,md}";
    case "xbox":
      return "docs/cert/xbox-{tcr,xr}-v*.{pdf,md}";
    case "switch":
      return "docs/cert/switch-lotcheck-v*.{pdf,md}";
  }
}
